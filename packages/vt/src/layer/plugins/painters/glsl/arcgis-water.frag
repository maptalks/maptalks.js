#version 300 es



#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp sampler2D;
#else
    precision mediump float;
    precision mediump sampler2D;
#endif
out lowp vec4 fragColor;
const vec3 fresnelSky = vec3(0.02, 1.0, 15.0);
const vec2 fresnelMaterial = vec2(0.02, 0.1);
const float roughness = 0.015;
const float foamIntensityExternal = 1.7;
const float ssrIntensity = 0.65;
const float ssrHeightFadeStart = 300000.0;
const float ssrHeightFadeEnd = 500000.0;
const float waterDiffusion = 0.775;
const float waterSeeColorMod = 0.8;
const float correctionViewingPowerFactor = 0.4;
const vec3 skyZenitColor = vec3(0.52, 0.68, 0.9);
const vec3 skyColor = vec3(0.67, 0.79, 0.9);
uniform sampler2D texWaveNormal;
uniform sampler2D texWavePerturbation;
uniform vec4 waveParams;
uniform vec2 waveDirection;
uniform sampler2D uShadowMapTex;
uniform int uShadowMapNum;
uniform vec4 uShadowMapDistance;
uniform mat4 uShadowMapMatrix[4];
uniform float uDepthHalfPixelSz;
uniform vec2 nearFar;
uniform sampler2D depthMapView;
uniform mat4 ssrViewMat;
uniform float invResolutionHeight;
uniform sampler2D lastFrameColorMap;
uniform mat4 reprojectionMat;
uniform mat4 rpProjectionMat;
uniform vec4 waterColor;
uniform vec3 lightingMainDirection;
uniform vec3 lightingMainIntensity;
uniform vec3 camPos;
uniform float timeElapsed;
uniform mat4 view;
in float linearDepth;
in vec2 vuv;
in vec3 vpos;
in vec3 vnormal;
in mat3 vtbnMatrix;
float normals2FoamIntensity(vec3 n, float waveStrength) {
    float normalizationFactor = max(0.015, waveStrength);
    return max((n.x + n.y)*0.3303545/normalizationFactor + 0.3303545, 0.0);
}
const vec2  FLOW_JUMP = vec2(6.0/25.0, 5.0/24.0);
vec2 textureDenormalized2D(sampler2D _tex, vec2 _uv) {
    return 2.0 * texture(_tex, _uv).rg - 1.0;
}
float sampleNoiseTexture(vec2 _uv) {
    return texture(texWavePerturbation, _uv).b;
}
vec3 textureDenormalized3D(sampler2D _tex, vec2 _uv) {
    return 2.0 * texture(_tex, _uv).rgb - 1.0;
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
const float TIME_NOISE_TEXTURE_REPEAT = 0.3737;
const float TIME_NOISE_STRENGTH = 7.77;
vec3 getWaveLayer(sampler2D _texNormal, sampler2D _dudv, vec2 _uv, vec2 _waveDir, float time) {
    float waveStrength = waveParams[0];
    vec2 waveMovement = time * -_waveDir;
    float timeNoise = sampleNoiseTexture(_uv * TIME_NOISE_TEXTURE_REPEAT) * TIME_NOISE_STRENGTH;
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
    vec3 normal = getWaveLayer(texWaveNormal, texWavePerturbation, _uv * waveTextureRepeat, waveDirection, _time);
    float foam = normals2FoamIntensity(normal, waveParams[0]);
    return vec4(normal, foam);
}
#define rejectBySlice(_pos_) false
#define discardBySlice(_pos_) {

}
#define highlightSlice(_color_, _pos_) (_color_)
const float MAX_RGBA_FLOAT = 255.0 / 256.0 +
255.0 / 256.0 / 256.0 +
255.0 / 256.0 / 256.0 / 256.0 +
255.0 / 256.0 / 256.0 / 256.0 / 256.0;
const vec4 FIXED_POINT_FACTORS = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
vec4 float2rgba(const float value) {
    float valueInValidDomain = clamp(value, 0.0, MAX_RGBA_FLOAT);
    vec4 fixedPointU8 = floor(fract(valueInValidDomain * FIXED_POINT_FACTORS) * 256.0);
    const float toU8AsFloat = 1.0 / 255.0;
    return fixedPointU8 * toU8AsFloat;
}
const vec4 RGBA_2_FLOAT_FACTORS = vec4(
255.0 / (256.0), 255.0 / (256.0 * 256.0), 255.0 / (256.0 * 256.0 * 256.0), 255.0 / (256.0 * 256.0 * 256.0 * 256.0)
);
float rgba2float(vec4 rgba) {
    return dot(rgba, RGBA_2_FLOAT_FACTORS);
}
int chooseCascade(float _linearDepth, out mat4 mat) {
    vec4 distance = uShadowMapDistance;
    float depth = _linearDepth;
    int i = depth < distance[1] ? 0 : depth < distance[2] ? 1 : depth < distance[3] ? 2 : 3;
    mat = i == 0 ? uShadowMapMatrix[0] : i == 1 ? uShadowMapMatrix[1] : i == 2 ? uShadowMapMatrix[2] : uShadowMapMatrix[3];
    return i;
}
vec3 lightSpacePosition(vec3 _vpos, mat4 mat) {
    vec4 lv = mat * vec4(_vpos, 1.0);
    lv.xy /= lv.w;
    return 0.5 * lv.xyz + vec3(0.5);
}
vec2 cascadeCoordinates(int i, vec3 lvpos) {
    return vec2(float(i - 2 * (i / 2)) * 0.5, float(i / 2) * 0.5) + 0.5 * lvpos.xy;
}
float readShadowMapDepth(vec2 uv, sampler2D _depthTex) {
    return rgba2float(texture(_depthTex, uv));
}
float posIsInShadow(vec2 uv, vec3 lvpos, sampler2D _depthTex) {
    return readShadowMapDepth(uv, _depthTex) < lvpos.z ? 1.0 : 0.0;
}
float filterShadow(vec2 uv, vec3 lvpos, float halfPixelSize, sampler2D _depthTex) {
    float texSize = 0.5 / halfPixelSize;
    vec2 st = fract((vec2(halfPixelSize) + uv) * texSize);
    float s00 = posIsInShadow(uv + vec2(-halfPixelSize, -halfPixelSize), lvpos, _depthTex);
    float s10 = posIsInShadow(uv + vec2(halfPixelSize, -halfPixelSize), lvpos, _depthTex);
    float s11 = posIsInShadow(uv + vec2(halfPixelSize, halfPixelSize), lvpos, _depthTex);
    float s01 = posIsInShadow(uv + vec2(-halfPixelSize, halfPixelSize), lvpos, _depthTex);
    return mix(mix(s00, s10, st.x), mix(s01, s11, st.x), st.y);
}
float readShadowMap(const in vec3 _vpos, float _linearDepth) {
    mat4 mat;
    int i = chooseCascade(_linearDepth, mat);
    if (i >= uShadowMapNum) {
        return 0.0;
    }
    vec3 lvpos = lightSpacePosition(_vpos, mat);
    if (lvpos.z >= 1.0) {
        return 0.0;
    }
    if (lvpos.x < 0.0 || lvpos.x > 1.0 || lvpos.y < 0.0 || lvpos.y > 1.0) {
        return 0.0;
    }
    vec2 uv = cascadeCoordinates(i, lvpos);
    return filterShadow(uv, lvpos, uDepthHalfPixelSz, uShadowMapTex);
}
const float PI = 3.141592653589793;
const float LIGHT_NORMALIZATION = 1.0 / PI;
const float INV_PI = 0.3183098861837907;
const float HALF_PI = 1.570796326794897;
struct PBRShadingWater {
    float NdotL;   // cos angle between normal and light direction
    
    float NdotV;   // cos angle between normal and view direction
    
    float NdotH;   // cos angle between normal and half vector
    
    float VdotH;   // cos angle between view direction and half vector
    
    float LdotH;   // cos angle between light direction and half vector
    
    float VdotN;   // cos angle between view direction and normal vector
};
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
vec3 brdfSpecularWater(in PBRShadingWater props, float roughness, vec3 F0, float F0Max) {
    vec3  F = fresnelReflection(props.VdotH, F0, F0Max);
    float dSun = normalDistributionWater(props.NdotH, roughness);
    float V = geometricOcclusionKelemen(props.LdotH);
    float diffusionSunHaze = mix(roughness + 0.045, roughness + 0.385, 1.0 - props.VdotH);
    float strengthSunHaze = 1.2;
    float dSunHaze = normalDistributionWater(props.NdotH, diffusionSunHaze)*strengthSunHaze;
    return ((dSun + dSunHaze) * V) * F;
}
vec3 tonemapACES(const vec3 x) {
    return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
}
const float GAMMA = 2.2;
const float INV_GAMMA = 0.4545454545;
vec4 delinearizeGamma(vec4 color) {
    return vec4(pow(color.rgb, vec3(INV_GAMMA)), color.w);
}
vec3 linearizeGamma(vec3 color) {
    return pow(color, vec3(GAMMA));
}
vec3 foamIntensity2FoamColor(float foamIntensityExternal, float foamPixelIntensity, vec3 skyZenitColor, float dayMod) {
    return foamIntensityExternal * (0.075 * skyZenitColor * pow(foamPixelIntensity, 4.) +  50.* pow(foamPixelIntensity, 23.0)) * dayMod;
}
float linearDepthFromFloat(float depth, vec2 nearFar) {
    return -(depth * (nearFar[1] - nearFar[0]) + nearFar[0]);
}
float linearDepthFromTexture(sampler2D depthTex, vec2 uv, vec2 nearFar) {
    return linearDepthFromFloat(rgba2float(texture(depthTex, uv)), nearFar);
}
vec2 reprojectionCoordinate(vec3 projectionCoordinate) {
    vec4 zw = rpProjectionMat * vec4(0.0, 0.0, -projectionCoordinate.z, 1.0);
    vec4 reprojectedCoord = reprojectionMat * vec4(zw.w * (projectionCoordinate.xy * 2.0 - 1.0), zw.z, zw.w);
    reprojectedCoord.xy /= reprojectedCoord.w;
    return reprojectedCoord.xy * 0.5 + 0.5;
}
const int maxSteps = 150;
vec4 applyProjectionMat(mat4 projectionMat, vec3 x) {
    vec4 projectedCoord = projectionMat * vec4(x, 1.0);
    projectedCoord.xy /= projectedCoord.w;
    projectedCoord.xy = projectedCoord.xy*0.5 + 0.5;
    return projectedCoord;
}
vec3 screenSpaceIntersection(vec3 dir, vec3 startPosition, vec3 viewDir, vec3 normal) {
    vec3 viewPos = startPosition;
    vec3 viewPosEnd = startPosition;
    
    // Project the start position to the screen
    
    vec4 projectedCoordStart = applyProjectionMat(rpProjectionMat, viewPos);
    vec3  Q0 = viewPos / projectedCoordStart.w; // homogeneous camera space
    
    float k0 = 1.0/ projectedCoordStart.w;
    
    // advance the position in the direction of the reflection
    
    viewPos += dir;
    vec4 projectedCoordVanishingPoint = applyProjectionMat(rpProjectionMat, dir);
    
    // Project the advanced position to the screen
    
    vec4 projectedCoordEnd = applyProjectionMat(rpProjectionMat, viewPos);
    vec3  Q1 = viewPos / projectedCoordEnd.w; // homogeneous camera space
    
    float k1 = 1.0/ projectedCoordEnd.w;
    
    // calculate the reflection direction in the screen space
    
    vec2 projectedCoordDir = (projectedCoordEnd.xy - projectedCoordStart.xy);
    vec2 projectedCoordDistVanishingPoint = (projectedCoordVanishingPoint.xy - projectedCoordStart.xy);
    float yMod = min(abs(projectedCoordDistVanishingPoint.y), 1.0);
    float projectedCoordDirLength = length(projectedCoordDir);
    float maxSt = float(maxSteps);
    
    // normalize the projection direction depending on maximum steps
    
    // this determines how blocky the reflection looks
    vec2 dP = yMod * (projectedCoordDir)/(maxSt * projectedCoordDirLength);
    
    // Normalize the homogeneous camera space coordinates
    
    vec3  dQ = yMod * (Q1 - Q0)/(maxSt * projectedCoordDirLength);
    float dk = yMod * (k1 - k0)/(maxSt * projectedCoordDirLength);
    
    // initialize the variables for ray marching
    
    vec2 P = projectedCoordStart.xy;
    vec3 Q = Q0;
    float k = k0;
    float rayStartZ = -startPosition.z; // estimated ray start depth value
    
    float rayEndZ = -startPosition.z;   // estimated ray end depth value
    
    float prevEstimateZ = -startPosition.z;
    float rayDiffZ = 0.0;
    float dDepth;
    float depth;
    float rayDiffZOld = 0.0;
    
    // early outs
    
    if (dot(normal, dir) < 0.0 || dot(-viewDir, normal) < 0.0)
    return vec3(P, 0.0);
    for(int i = 0; i < maxSteps-1; i++) {
        depth = -linearDepthFromTexture(depthMapView, P, nearFar); // get linear depth from the depth buffer
        
        
        // estimate depth of the marching ray
        rayStartZ = prevEstimateZ;
        dDepth = -rayStartZ - depth;
        rayEndZ = (dQ.z * 0.5 + Q.z)/ ((dk * 0.5 + k));
        rayDiffZ = rayEndZ- rayStartZ;
        prevEstimateZ = rayEndZ;
        if(-rayEndZ > nearFar[1] || -rayEndZ < nearFar[0] || P.y < 0.0  || P.y > 1.0 ) {
            return vec3(P, 0.);
        }
        // If we detect a hit - return the intersection point, two conditions:
        //  - dDepth > 0.0 - sampled point depth is in front of estimated depth
        //  - if difference between dDepth and rayDiffZOld is not too large
        //  - if difference between dDepth and 0.025/abs(k) is not too large
        //  - if the sampled depth is not behind far plane or in front of near plane
        
        if((dDepth) < 0.025/abs(k) + abs(rayDiffZ) && dDepth > 0.0 && depth > nearFar[0] && depth < nearFar[1] && abs(P.y - projectedCoordStart.y) > invResolutionHeight) {
            return vec3(P, depth);
        }
        // continue with ray marching
        P += dP;
        Q.z += dQ.z;
        k += dk;
        rayDiffZOld = rayDiffZ;
    }
    return vec3(P, 0.0);
}
PBRShadingWater shadingInfo;
vec3 getSkyGradientColor(in float cosTheta, in vec3 horizon, in vec3 zenit) {
    float exponent = pow((1.0 - cosTheta), fresnelSky[2]);
    return mix(zenit, horizon, exponent);
}
vec3 getSeaColor(in vec3 n, in vec3 v, in vec3 l, vec3 color, in vec3 lightIntensity, in vec3 localUp, in float shadow, float foamIntensity, vec3 positionView) {
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
    vec3 skyHorizon = linearizeGamma(skyColor);
    vec3 skyZenit = linearizeGamma(skyZenitColor);
    vec3 skyColor = getSkyGradientColor(upDotV, skyHorizon, skyZenit );
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
    vec4 viewPosition = vec4(positionView.xyz, 1.0);
    vec3 viewDir = normalize(viewPosition.xyz);
    vec4 viewNormalVectorCoordinate = ssrViewMat *vec4(n, 0.0);
    vec3 viewNormal = normalize(viewNormalVectorCoordinate.xyz);
    vec4 viewUp = ssrViewMat *vec4(localUp, 0.0);
    float correctionViewingFactor = pow(max(dot(-viewDir, viewUp.xyz), 0.0), correctionViewingPowerFactor);
    vec3 viewNormalCorrected = mix(viewUp.xyz, viewNormal, correctionViewingFactor);
    vec3 reflected = normalize(reflect(viewDir, viewNormalCorrected));
    vec3 hitCoordinate = screenSpaceIntersection( normalize(reflected), viewPosition.xyz, viewDir, viewUp.xyz);
    vec3 reflectedColor = vec3(0.0);
    if (hitCoordinate.z > 0.0) {
        vec2 reprojectedCoordinate = reprojectionCoordinate(hitCoordinate);
        vec2 dCoords = smoothstep(0.3, 0.6, abs(vec2(0.5, 0.5) - hitCoordinate.xy));
        float heightMod = smoothstep(ssrHeightFadeEnd, ssrHeightFadeStart, -positionView.z);
        reflectionHit = waterDiffusion * clamp(1.0 - (1.3*dCoords.y), 0.0, 1.0) * heightMod;
        reflectedColor = linearizeGamma(texture(lastFrameColorMap, reprojectedCoordinate).xyz)* reflectionHit * fresnelModifier.y * ssrIntensity;
    }
    float seeColorMod = mix(waterSeeColorMod, waterSeeColorMod*0.5, reflectionHit);
    return tonemapACES((1. - reflectionHit) * reflSky + reflectedColor + reflSea * seeColorMod + specular + foam);
}
vec4 premultiplyAlpha(vec4 v) {
    return vec4(v.rgb * v.a, v.a);
}
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), min(d / (q.x + e), 1.0), q.x);
}
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
float rgb2v(vec3 c) {
    return max(c.x, max(c.y, c.z));
}
void main() {
    discardBySlice(vpos);
    vec3 localUp = vnormal;
    // the created normal is in tangent space
    
    vec4 tangentNormalFoam = getSurfaceNormalAndFoam(vuv, timeElapsed);
    
    // we rotate the normal according to the tangent-bitangent-normal-Matrix
    
    vec3 n = normalize(vtbnMatrix * tangentNormalFoam.xyz);
    vec3 v = -normalize(vpos - camPos);
    float shadow = 1.0 - readShadowMap(vpos, linearDepth);
    vec4 vPosView = view*vec4(vpos, 1.0);
    vec4 final = vec4(getSeaColor(n, v, lightingMainDirection, waterColor.rgb, lightingMainIntensity, localUp, shadow, tangentNormalFoam.w, vPosView.xyz), waterColor.w);
    
    // gamma correction
    
    fragColor = delinearizeGamma(final);
    fragColor = highlightSlice(fragColor, vpos);
}
