#define SHADER_NAME WATER

precision highp float;
precision highp sampler2D;

#include <hsv_frag>
uniform vec3 hsv;
uniform float contrast;
uniform float layerOpacity;

#if defined(HAS_SHADOWING)
    #include <vsm_shadow_frag>
#endif

#include <highlight_frag>

#if defined(HAS_IBL_LIGHTING)
    uniform vec3 hdrHSV;
    uniform samplerCube prefilterMap;
    uniform sampler2D brdfLUT;
    uniform mat3 environmentTransform;
    uniform vec3 diffuseSPH[9];

    vec3 computeDiffuseSPH(const in vec3 normal) {
        vec3 n = environmentTransform * normal;

        float x = n.x;
        float y = n.y;
        float z = n.z;
        vec3 result = (
            diffuseSPH[0] +

            diffuseSPH[1] * x +
            diffuseSPH[2] * y +
            diffuseSPH[3] * z +

            diffuseSPH[4] * z * x +
            diffuseSPH[5] * y * z +
            diffuseSPH[6] * y * x +
            diffuseSPH[7] * (3.0 * z * z - 1.0) +
            diffuseSPH[8] * (x*x - y*y)
          );
        if (length(hdrHSV) > 0.0) {
            result = hsv_apply(result, hdrHSV);
        }
        return max(result, vec3(0.0));
    }

    vec3 integrateBRDF(const in vec3 specular, const in float roughness, const in float NoV, const in float f90) {
        vec4 rgba = texture2D(brdfLUT, vec2(NoV, roughness));
        float b = (rgba[3] * 65280.0 + rgba[2] * 255.0);
        float a = (rgba[1] * 65280.0 + rgba[0] * 255.0);
        const float div = 1.0 / 65535.0;
        return (specular * a + b * f90) * div;

        // vec4 rgba = texture2D(brdfLUT, vec2(NoV, roughness));
        // return (specular * rgba.x + rgba.y * f90);
    }
#else
    uniform vec3 ambientColor;
#endif

struct PBRShadingWater {
    float NdotL;   // cos angle between normal and light direction
    float NdotV;   // cos angle between normal and view direction
    float NdotH;   // cos angle between normal and half vector
    float VdotH;   // cos angle between view direction and half vector
    float LdotH;   // cos angle between light direction and half vector
    float VdotN;   // cos angle between view direction and normal vector
};

vec3 decodeRGBM(const in vec4 color, const in float range) {
    if(range <= 0.0) return color.rgb;
    return range * color.rgb * color.a;
}

#ifdef HAS_SSR
    varying vec4 vViewVertex;
    uniform mat3 modelViewNormalMatrix;
    uniform sampler2D TextureDepth;
    uniform highp vec2 outSize;
    uniform float ssrFactor;
    uniform float ssrQuality;
    uniform sampler2D TextureReflected;
    uniform highp mat4 projMatrix;
    uniform mat4 invProjMatrix;
    uniform vec4 outputFovInfo[2];
    uniform mat4 reprojViewProjMatrix;
    uniform vec2 cameraNearFar;
    float decodeDepth(const in vec4 pack) {
        // if(decodeProfile(pack) == 0) {
        //     const vec3 decode = 1.0 / vec3(1.0, 255.0, 65025.0);
        //     return dot(pack.rgb, decode);
        // }
        return pack.r + pack.g / 255.0;
    }
    float interleavedGradientNoise(const in vec2 fragCoord, const in float frameMod) {
        vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
        return fract(magic.z * fract(dot(fragCoord.xy + frameMod * vec2(47.0, 17.0) * 0.695, magic.xy))) * 0.5;
    }
    vec3 computeLodNearestPixelSizePowLevel(const in float lodLevelIn, const in float maxLod, const in vec2 size) {
        float lodLevel = min(maxLod - 0.01, lodLevelIn);
        float lowerLevel = floor(lodLevel);
        float higherLevel = min(maxLod, lowerLevel + 1.0);
        float powLevel = pow(2.0, higherLevel);
        vec2 pixelSize = 2.0 * powLevel / size;
        if (lodLevel - lowerLevel > 0.5) powLevel *= 2.0;
        return vec3(pixelSize, powLevel);
    }
    vec2 computeLodUVNearest(const in vec2 uvIn, const in vec3 pixelSizePowLevel) {
        vec2 uv = max(pixelSizePowLevel.xy, min(1.0 - pixelSizePowLevel.xy, uvIn));
        return vec2(2.0 * uv.x, pixelSizePowLevel.z - 1.0 - uv.y) / pixelSizePowLevel.z;
    }
    vec3 ssrViewToScreen(const in mat4 projection, const in vec3 viewVertex) {
        vec4 projected = projection * vec4(viewVertex, 1.0);
        return vec3(0.5 + 0.5 * projected.xy / projected.w, projected.w);
    }
    vec3 fetchColorLod(const in float level, const in vec2 uv) {
        return texture2D(TextureReflected, uv).rgb;
    }

    float linearizeDepth(float depth) {
        highp mat4 projection = projMatrix;
        highp float z = depth * 2.0 - 1.0; // depth in clip space
        return -projection[3].z / (z + projection[2].z);
    }

    float fetchDepth(const vec2 uv) {
        float depth = decodeDepth(texture2D(TextureDepth, uv));
        return depth;
    }


    vec3 unrealImportanceSampling(const in float frameMod, const in vec3 tangentX, const in vec3 tangentY, const in vec3 tangentZ, const in vec3 eyeVector, const in float rough4) {
        vec2 E;
        E.x = interleavedGradientNoise(gl_FragCoord.yx, frameMod);
        E.y = fract(E.x * 52.9829189);
        E.y = mix(E.y, 1.0, 0.7);
        float phi = 2.0 * 3.14159 * E.x;
        float cosTheta = pow(max(E.y, 0.000001), rough4 / (2.0 - rough4));
        float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
        vec3 h = vec3(sinTheta * cos(phi), sinTheta * sin(phi), cosTheta);
        h = h.x * tangentX + h.y * tangentY + h.z * tangentZ;
        return normalize((2.0 * dot(eyeVector, h)) * h - eyeVector);
    }
    float getStepOffset(const in float frameMod) {
        return (interleavedGradientNoise(gl_FragCoord.xy, frameMod) - 0.5);
    }
    vec3 computeRayDirUV(const in vec3 rayOriginUV, const in float rayLen, const in vec3 rayDirView) {
        vec3 rayDirUV = ssrViewToScreen(projMatrix, vViewVertex.xyz + rayDirView * rayLen);
        rayDirUV.z = 1.0 / rayDirUV.z;
        rayDirUV -= rayOriginUV;
        float scaleMaxX = min(1.0, 0.99 * (1.0 - rayOriginUV.x) / max(1e-5, rayDirUV.x));
        float scaleMaxY = min(1.0, 0.99 * (1.0 - rayOriginUV.y) / max(1e-5, rayDirUV.y));
        float scaleMinX = min(1.0, 0.99 * rayOriginUV.x / max(1e-5, -rayDirUV.x));
        float scaleMinY = min(1.0, 0.99 * rayOriginUV.y / max(1e-5, -rayDirUV.y));
        return rayDirUV * min(scaleMaxX, scaleMaxY) * min(scaleMinX, scaleMinY);
    }

    float binarySearch(const in vec3 rayOriginUV, const in vec3 rayDirUV, inout float startSteps, inout float endSteps) {
        float steps = (endSteps + startSteps) * 0.5;
        vec3 sampleUV = rayOriginUV + rayDirUV * steps;
        float z = fetchDepth(sampleUV.xy);
        float depth = linearizeDepth(z);
        float sampleDepth = -1.0 / sampleUV.z;
        startSteps = depth > sampleDepth ? startSteps : steps;
        endSteps = depth > sampleDepth ? steps : endSteps;
        return steps;
    }

    vec4 rayTraceUnrealSimple(
    const in vec3 rayOriginUV, const in float rayLen, in float depthTolerance, const in vec3 rayDirView, const in float roughness, const in float frameMod) {
        const int checkSteps = 20;
        float invNumSteps = 1.0 / float(checkSteps);
        depthTolerance *= invNumSteps;
        vec3 rayDirUV = computeRayDirUV(rayOriginUV, rayLen, rayDirView);
        float sampleTime = /* getStepOffset(frameMod) * invNumSteps +  */invNumSteps;
        vec3 diffSampleW = vec3(0.0, sampleTime, 1.0);
        vec3 sampleUV;
        float z, depth, sampleDepth, depthDiff, timeLerp, hitTime;
        bool hit;
        float hitDepth = 1.0;
        float steps;

        for (int i = 0; i < checkSteps; i++) {
            sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
            z = fetchDepth(sampleUV.xy);
            depth = linearizeDepth(z);
            sampleDepth = -1.0 / sampleUV.z;
            depthDiff = sampleDepth - depth;
            depthDiff *= clamp(sign(abs(depthDiff) - rayLen * invNumSteps * invNumSteps), 0.0, 1.0);
            hit = abs(depthDiff + depthTolerance) < depthTolerance;
            timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
            hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
            diffSampleW.z = min(diffSampleW.z, hitTime);
            diffSampleW.x = depthDiff;
            if (hit) {
                float startSteps = diffSampleW.y - invNumSteps;
                float endSteps = diffSampleW.y;
                steps = binarySearch(rayOriginUV, rayDirUV, startSteps, endSteps);
                steps = binarySearch(rayOriginUV, rayDirUV, startSteps, endSteps);
                steps = binarySearch(rayOriginUV, rayDirUV, startSteps, endSteps);
                hitDepth = steps;
                break;
            }
            diffSampleW.y += invNumSteps;
        }

        return vec4(rayOriginUV + rayDirUV * hitDepth, 1.0 - hitDepth);
    }

    // vec4 fetchColorContribution(
    // in vec4 resRay, const in float maskSsr, const in vec3 specularEnvironment, const in vec3 specularColor, const in float roughness) {
    //     vec4 AB = mix(outputFovInfo[0], outputFovInfo[1], resRay.x);
    //     resRay.xyz = vec3(mix(AB.xy, AB.zw, resRay.y), 1.0) * -1.0 / resRay.z;
    //     resRay.xyz = (reprojViewProjMatrix * vec4(resRay.xyz, 1.0)).xyw;
    //     resRay.xy /= resRay.z;

    //     float maskEdge = clamp(6.0 - 6.0 * max(abs(resRay.x), abs(resRay.y)), 0.0, 1.0);
    //     resRay.xy = 0.5 + 0.5 * resRay.xy;
    //     vec3 fetchColor = specularColor * fetchColorLod(roughness * (1.0 - resRay.w), resRay.xy);
    //     return vec4(mix(specularEnvironment, fetchColor, maskSsr * maskEdge), 1.0);
    // }

    vec3 fetchColorContribution(
    in vec4 resRay, const in float maskSsr, const in vec3 specularEnvironment, const in vec3 specularColor, const in float roughness) {
        vec4 AB = mix(outputFovInfo[0], outputFovInfo[1], resRay.x);
        resRay.xyz = vec3(mix(AB.xy, AB.zw, resRay.y), 1.0) * -1.0 / resRay.z;
        resRay.xyz = (reprojViewProjMatrix * vec4(resRay.xyz, 1.0)).xyw;
        resRay.xy /= resRay.z;

        float maskEdge = clamp(6.0 - 6.0 * max(abs(resRay.x), abs(resRay.y)), 0.0, 1.0);
        resRay.xy = 0.5 + 0.5 * resRay.xy;
        // vec3 fetchColor = specularColor * fetchColorLod(roughness * (1.0 - resRay.w), resRay.xy);
        // return vec4(mix(specularEnvironment, fetchColor, maskSsr * maskEdge), 1.0);
        return vec3(resRay.xy, 1.0);
    }


    /**
     * @param specularEnvironment 环境光中的specular部分
     * @param specularColor 材质的specularColor
    */
    vec3 ssr(const in vec3 specularEnvironment, const in vec3 specularColor, const in float roughness, const in vec3 normal, const in vec3 eyeVector) {
        float uFrameModTaaSS = 0.0;
        vec4 result = vec4(0.0);
        float rough4 = roughness * roughness;
        rough4 = rough4 * rough4;
        vec3 upVector = abs(normal.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
        vec3 tangentX = normalize(cross(upVector, normal));
        vec3 tangentY = cross(normal, tangentX);
        float maskSsr = ssrFactor * clamp(-4.0 * dot(eyeVector, normal) + 3.8, 0.0, 1.0);
        maskSsr *= clamp(4.7 - roughness * 5.0, 0.0, 1.0);
        vec3 rayOriginUV = ssrViewToScreen(projMatrix, vViewVertex.xyz);
        rayOriginUV.z = 1.0 / rayOriginUV.z;
        vec3 rayDirView = unrealImportanceSampling(uFrameModTaaSS, tangentX, tangentY, normal, eyeVector, rough4);

        float rayLen = mix(cameraNearFar.y + vViewVertex.z, -vViewVertex.z - cameraNearFar.x, rayDirView.z * 0.5 + 0.5);
        float depthTolerance = 0.5 * rayLen;
        vec4 resRay;
        if (dot(rayDirView, normal) > 0.001 && maskSsr > 0.0) {
            resRay = rayTraceUnrealSimple(rayOriginUV, rayLen, depthTolerance, rayDirView, roughness, uFrameModTaaSS);
            if (resRay.w > 0.0) return fetchColorContribution(resRay, maskSsr, specularEnvironment, specularColor, roughness);
        }
        return vec3(0.0);
    }
#endif

const vec3 NORMAL = vec3(0., 0., 1.);

uniform mat4 viewMatrix;
uniform sampler2D normalTexture;
uniform sampler2D heightTexture;
// uniform vec3 octaveTextureRepeat;
// waveParams是一个长度为4的数组，分别代表[波动强度, 法线贴图的repeat次数, 水流的强度, 水流动的偏移量]
uniform vec4 waveParams;
// const vec4 waveParams = vec4(0.09, 12, 0.03, -0.5);
uniform vec2 waterDir;
uniform vec4 waterBaseColor;
uniform vec3 lightDirection;
uniform vec3 lightColor;
uniform vec3 camPos;
uniform float timeElapsed;
varying vec2 vUv;
varying vec2 vNoiseUv;
varying vec3 vPos;
varying mat3 vTbnMatrix;

float normals2FoamIntensity(vec3 n, float waveStrength) {
    float normalizationFactor = max(0.015, waveStrength);
    return max((n.x + n.y)*0.3303545/normalizationFactor + 0.3303545, 0.0);
}
const vec2  FLOW_JUMP = vec2(6.0/25.0, 5.0/24.0);
vec2 textureDenormalized2D(sampler2D _tex, vec2 uv) {
    return 2.0 * texture2D(_tex, uv).rg - 1.0;
}
float sampleNoiseTexture(vec2 uv) {
    return texture2D(heightTexture, uv).b;
}
vec3 textureDenormalized3D(sampler2D _tex, vec2 uv) {
    return 2.0 * texture2D(_tex, uv).rgb - 1.0;
}
float computeProgress(vec2 uv, float time) {
    return fract(time);
}
float computeWeight(vec2 uv, float time) {
    float progress = computeProgress(uv, time);
    return 1.0 - abs(1.0 - 2.0 * progress);
}
vec3 computeUVPerturbedWeigth(sampler2D texFlow, vec2 uv, float time, float phaseOffset) {
    float flowStrength = waveParams[2];
    float flowOffset = waveParams[3];
    vec2 flowVector = textureDenormalized2D(texFlow, uv) * flowStrength;
    float progress = computeProgress(uv, time + phaseOffset);
    float weight = computeWeight(uv, time + phaseOffset);
    vec2 result = uv;
    result -= flowVector * (progress + flowOffset);
    result += phaseOffset;
    result += (time - progress) * FLOW_JUMP;
    return vec3(result, weight);
}

// const float TIME_NOISE_TEXTURE_REPEAT = 0.3737;
const float TIME_NOISE_STRENGTH = 7.77;

vec3 getWaveLayer(sampler2D _texNormal, sampler2D _dudv, vec2 _uv, vec2 _waveDir, float time) {
    float waveStrength = waveParams[0];
    vec2 waveMovement = time * -_waveDir;
    // float timeNoise = sampleNoiseTexture(_uv * TIME_NOISE_TEXTURE_REPEAT) * TIME_NOISE_STRENGTH;
    float timeNoise = sampleNoiseTexture(vNoiseUv) * TIME_NOISE_STRENGTH;
    vec3 uv_A = computeUVPerturbedWeigth(_dudv, _uv + waveMovement, time + timeNoise, 0.0);
    vec3 uv_B = computeUVPerturbedWeigth(_dudv, _uv + waveMovement, time + timeNoise, 0.5);
    vec3 normal_A = textureDenormalized3D(_texNormal, uv_A.xy) * uv_A.z;
    vec3 normal_B = textureDenormalized3D(_texNormal, uv_B.xy) * uv_B.z;
    vec3 mixNormal = normalize(normal_A + normal_B);
    mixNormal.xy *= waveStrength;
    mixNormal.z = sqrt(1.0 - dot(mixNormal.xy, mixNormal.xy));
    return mixNormal;
}
vec4 getSurfaceNormalAndFoam(vec2 _uv, float _time) {
    float waveTextureRepeat = waveParams[1];
    vec3 normal = getWaveLayer(normalTexture, heightTexture, _uv * waveTextureRepeat, waterDir, _time);
    float foam = normals2FoamIntensity(normal, waveParams[0]);
    return vec4(normal, foam);
}


const float PI = 3.141592653589793;
const float LIGHT_NORMALIZATION = 1.0 / PI;
const float INV_PI = 0.3183098861837907;
const float HALF_PI = 1.570796326794897;
const float correctionViewingPowerFactor = 0.4;

float dtrExponent = 2.2;
vec3 fresnelReflection(float angle, vec3 f0, float f90) {
    return f0 + (f90 - f0) * pow(1.0 - angle, 5.0);
}
float normalDistributionWater(float NdotH, float roughness) {
    float r2 = roughness * roughness;
    float NdotH2 = NdotH * NdotH;
    float denom = pow((NdotH2 * (r2 - 1.0) + 1.0), dtrExponent) * PI;
    return r2 / denom;
}
float geometricOcclusionKelemen(float LoH) {
    return 0.25 / (LoH * LoH);
}
vec3 tonemapACES(const vec3 x) {
    return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
}
const float GAMMA = 2.2;
const float INV_GAMMA = 0.4545454545; // 1 / GAMMA


// gamma校正
vec4 delinearizeGamma(vec4 color) {
    return vec4(pow(color.rgb, vec3(INV_GAMMA)), color.w);
}
vec3 linearizeGamma(vec3 color) {
    return pow(color, vec3(GAMMA));
}
const vec3 fresnelSky = vec3(0.02, 1.0, 5.0);

const vec2 fresnelMaterial = vec2(0.02, 0.1);

const float roughness = 0.06;
const float foamIntensityExternal = 1.7;
const vec3 skyZenitColor = vec3(0, 0.6, 0.9);
const vec3 skyColor = vec3(0.72, 0.92, 1.0);
const float ssrIntensity = 0.65;
const float ssrHeightFadeStart = 300000.0;
const float ssrHeightFadeEnd = 500000.0;
const float waterDiffusion = 0.775;
const float waterSeeColorMod = 0.8;

PBRShadingWater shadingInfo;

vec3 brdfSpecularWater(in PBRShadingWater props, float roughness, vec3 F0, float F0Max) {
    vec3  F = fresnelReflection(props.VdotH, F0, F0Max);
    float dSun = normalDistributionWater(props.NdotH, roughness);
    float V = geometricOcclusionKelemen(props.LdotH);
    float diffusionSunHaze = mix(roughness + 0.045, roughness + 0.385, 1.0 - props.VdotH);
    float strengthSunHaze = 1.2;
    float dSunHaze = normalDistributionWater(props.NdotH, diffusionSunHaze) * strengthSunHaze;
    return ((dSun + dSunHaze) * V) * F;
}
vec3 foamIntensity2FoamColor(float foamIntensityExternal, float foamPixelIntensity, vec3 skyZenitColor, float dayMod) {
    return foamIntensityExternal * (0.075 * skyZenitColor * pow(foamPixelIntensity, 4.) +  50.* pow(foamPixelIntensity, 23.0)) * dayMod;
}
//计算菲涅尔折射
vec3 getSkyGradientColor(in float cosTheta, in vec3 horizon, in vec3 zenit) {
    float exponent = pow((1.0 - cosTheta), fresnelSky[2]);
    return mix(zenit, horizon, exponent);
}

vec3 getSkyColor(in vec3 n, in vec3 v, in float upDotV, in float roughness) {
    #ifdef HAS_IBL_LIGHTING
        vec3 R = reflect(-v, n);
        vec3 prefilteredColor = textureCube(prefilterMap, environmentTransform * R).rgb;
        float factor = clamp(1.0 + dot(R, n), 0.0, 1.0);
        prefilteredColor *= factor * factor;
        vec3 specular = prefilteredColor;
        vec3 diffuse = computeDiffuseSPH(n);
        float f90 = clamp(50.0 * waterBaseColor.g, 0.0, 1.0);
        vec3 brdf = integrateBRDF(waterBaseColor.rgb, roughness, dot(n, v), f90);
        return specular * brdf + diffuse;
    #else
        vec3 skyHorizon = linearizeGamma(skyColor);
        vec3 skyZenit = linearizeGamma(skyZenitColor);
        vec3 skyColor = getSkyGradientColor(upDotV, skyHorizon, skyZenit );
        return skyColor;
    #endif
}


vec3 renderPixel(in vec3 n, in vec3 v, in vec3 l, vec3 color, in vec3 lightIntensity, in vec3 localUp, in float shadow, float foamIntensity, vec3 positionView) {
    float reflectionHit = 0.;
    vec3 seaWaterColor = linearizeGamma(color);
    vec3 h = normalize(l + v);
    shadingInfo.NdotL = clamp(dot(n, l), 0.0, 1.0);
    shadingInfo.NdotV = clamp(dot(n, v), 0.001, 1.0);
    shadingInfo.VdotN = clamp(dot(v, n), 0.001, 1.0);
    shadingInfo.NdotH = clamp(dot(n, h), 0.0, 1.0);
    shadingInfo.VdotH = clamp(dot(v, h), 0.0, 1.0);
    shadingInfo.LdotH = clamp(dot(l, h), 0.0, 1.0);
    float upDotV = max(dot(localUp, v), 0.0);
    vec3 skyColor = getSkyColor(n, v, upDotV, roughness);
    float upDotL = max(dot(localUp, l), 0.0);
    float daytimeMod = 0.1 + upDotL * 0.9;
    skyColor *= daytimeMod;
    float shadowModifier = clamp(shadow, 0.8, 1.0);
    vec3 fresnelModifier = fresnelReflection(shadingInfo.VdotN, vec3(fresnelSky[0]), fresnelSky[1]);
    vec3 reflSky = fresnelModifier * skyColor * shadowModifier;
    vec3 reflSea = seaWaterColor * mix(skyColor, upDotL * lightIntensity * LIGHT_NORMALIZATION, 2.0 / 3.0) * shadowModifier;
    vec3 specular = vec3(0.0);
    if(upDotV > 0.0 && upDotL > 0.0) {
        vec3 specularSun = brdfSpecularWater(shadingInfo, roughness, vec3(fresnelMaterial[0]), fresnelMaterial[1]);
        vec3 incidentLight = lightIntensity * LIGHT_NORMALIZATION * shadow;
        specular = shadingInfo.NdotL * incidentLight * specularSun;
    }
    vec3 foam = vec3(0.0);
    if(upDotV > 0.0) {
        foam = foamIntensity2FoamColor(foamIntensityExternal, foamIntensity, skyZenitColor, daytimeMod);
    }
    vec3 reflectedColor = vec3(0.0);
    #ifdef HAS_SSR
        float heightMod = smoothstep(ssrHeightFadeEnd, ssrHeightFadeStart, -positionView.z);
        mat4 ssrViewMat = viewMatrix;
        vec4 viewPosition = vec4(positionView.xyz, 1.0);
        vec3 viewDir = normalize(viewPosition.xyz);
        vec4 viewNormalVectorCoordinate = ssrViewMat *vec4(n, 0.0);
        vec3 viewNormal = normalize(viewNormalVectorCoordinate.xyz);
        vec4 viewUp = ssrViewMat *vec4(localUp, 0.0);
        float correctionViewingFactor = pow(max(dot(-viewDir, viewUp.xyz), 0.0), correctionViewingPowerFactor);
        vec3 viewNormalCorrected = mix(viewUp.xyz, viewNormal, correctionViewingFactor);

        vec3 ssrCoord = ssr(vec3(0.0), vec3(1.0), roughness, normalize(viewNormalCorrected), -normalize(vViewVertex.xyz));
        if (ssrCoord.z > 0.0) {
            vec2 dCoords = smoothstep(0.3, 0.6, abs(vec2(0.5, 0.5) - ssrCoord.xy));
            reflectionHit = waterDiffusion * clamp(1.0 - (1.3*dCoords.y), 0.0, 1.0) * heightMod;
            vec3 ssrFetched = fetchColorLod(0.0, ssrCoord.xy);
            reflectedColor = linearizeGamma(ssrFetched) * reflectionHit * fresnelModifier.y * ssrIntensity;
        }

    #endif
    float seeColorMod = mix(waterSeeColorMod, waterSeeColorMod*0.5, reflectionHit);
    return tonemapACES((1. - reflectionHit) * reflSky + reflectedColor + reflSea * seeColorMod + specular + foam);



}

void main() {
    vec3 localUp = NORMAL;
    //切线空间
    vec4 tangentNormalFoam = getSurfaceNormalAndFoam(vUv, timeElapsed);

    //在切线空间中旋转法线
    vec3 n = normalize(vTbnMatrix * tangentNormalFoam.xyz);
    vec3 v = -normalize(vPos - camPos);
    vec3 l = normalize(-lightDirection);

    #if defined(HAS_SHADOWING)
        float shadow = shadow_computeShadow();
    #else
        float shadow = 1.0;
    #endif
    vec4 vPosView = viewMatrix * vec4(vPos, 1.0);
    vec4 final = vec4(renderPixel(n, v, l, waterBaseColor.rgb, lightColor, localUp, shadow, tangentNormalFoam.w, vPosView.xyz), waterBaseColor.a);
    gl_FragColor = delinearizeGamma(final);

    if (contrast != 1.0) {
        gl_FragColor = contrastMatrix(contrast) * gl_FragColor;
    }
    if (length(hsv) > 0.0) {
        gl_FragColor = hsv_apply(gl_FragColor, hsv);
    }

    gl_FragColor = highlight_blendColor(gl_FragColor) * layerOpacity;
}
