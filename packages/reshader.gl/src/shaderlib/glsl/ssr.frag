//DEPRECATED
#version 100
#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform float uAlbedoPBRFactor;
uniform float uEmitColorFactor;
uniform float uEnvironmentExposure;
uniform float uFrameMod;
uniform float uFrameModTaaSS;
uniform float uMetalnessPBRFactor;
uniform float uQuality;
uniform float rgbmRange;
uniform float uRoughnessPBRFactor;
uniform float uShadowReceive3_bias;
uniform float specularF0Factor;
uniform float ssrFactor;
uniform float uStaticFrameNumShadow3;
uniform int uDrawOpaque;
uniform int emitMultiplicative;
uniform int outputLinear;
uniform mat3 environmentTransform;
uniform mat4 uPreviousProjection;
uniform mat4 uPreviousViewInvView;
uniform mat4 uProjectionMatrix;
uniform mat4 reprojViewProjMatrix;
uniform sampler2D Texture0;
uniform sampler2D Texture15;
uniform sampler2D brdfLUT;
uniform sampler2D uTextureMipmapDepth;
uniform sampler2D uTextureReflected;
uniform samplerCube prefilterMap;
uniform vec2 uGlobalTexRatio;
uniform vec2 cameraNearFar;
uniform vec2 uPreviousGlobalTexRatio;
uniform vec2 uPreviousGlobalTexSize;
uniform vec2 uShadow_Texture3_depthRange;
uniform vec2 uShadow_Texture3_renderSize;
uniform vec2 prefilterMiplevel;
uniform vec2 prefilterSize;
uniform vec2 uTextureReflectedSize;
uniform vec3 diffuseSPH[9];
uniform vec3 uShadow_Texture3_projection;
uniform vec3 uSketchfabLight3_viewDirection;
uniform vec4 halton;
uniform vec4 uShadow_Texture3_viewLook;
uniform vec4 uShadow_Texture3_viewRight;
uniform vec4 uShadow_Texture3_viewUp;
uniform vec4 uSketchfabLight3_diffuse;
uniform vec4 outputFovInfo[2];
varying vec3 vViewNormal;
varying vec3 vModelVertex;
varying vec3 vModelNormal;
varying vec4 vViewVertex;
#define SHADER_NAME PBR_Opaque(_)

float linearTosRGB(const in float color) {
    return  color < 0.0031308 ? color * 12.92 : 1.055 * pow(color, 1.0/2.4) - 0.055;
}
vec3 linearTosRGB(const in vec3 color) {
    return vec3( color.r < 0.0031308 ? color.r * 12.92 : 1.055 * pow(color.r, 1.0/2.4) - 0.055, color.g < 0.0031308 ? color.g * 12.92 : 1.055 * pow(color.g, 1.0/2.4) - 0.055, color.b < 0.0031308 ? color.b * 12.92 : 1.055 * pow(color.b, 1.0/2.4) - 0.055);
}
vec4 linearTosRGB(const in vec4 color) {
    return vec4( color.r < 0.0031308 ? color.r * 12.92 : 1.055 * pow(color.r, 1.0/2.4) - 0.055, color.g < 0.0031308 ? color.g * 12.92 : 1.055 * pow(color.g, 1.0/2.4) - 0.055, color.b < 0.0031308 ? color.b * 12.92 : 1.055 * pow(color.b, 1.0/2.4) - 0.055, color.a);
}
float sRGBToLinear(const in float color) {
    return  color < 0.04045 ? color * (1.0 / 12.92) : pow((color + 0.055) * (1.0 / 1.055), 2.4);
}
vec3 sRGBToLinear(const in vec3 color) {
    return vec3( color.r < 0.04045 ? color.r * (1.0 / 12.92) : pow((color.r + 0.055) * (1.0 / 1.055), 2.4), color.g < 0.04045 ? color.g * (1.0 / 12.92) : pow((color.g + 0.055) * (1.0 / 1.055), 2.4), color.b < 0.04045 ? color.b * (1.0 / 12.92) : pow((color.b + 0.055) * (1.0 / 1.055), 2.4));
}
vec4 sRGBToLinear(const in vec4 color) {
    return vec4( color.r < 0.04045 ? color.r * (1.0 / 12.92) : pow((color.r + 0.055) * (1.0 / 1.055), 2.4), color.g < 0.04045 ? color.g * (1.0 / 12.92) : pow((color.g + 0.055) * (1.0 / 1.055), 2.4), color.b < 0.04045 ? color.b * (1.0 / 12.92) : pow((color.b + 0.055) * (1.0 / 1.055), 2.4), color.a);
}
vec3 RGBMToRGB( const in vec4 rgba ) {
    const float maxRange = 8.0;
    return rgba.rgb * maxRange * rgba.a;
}
const mat3 LUVInverse = mat3( 6.0013, -2.700, -1.7995, -1.332, 3.1029, -5.7720, 0.3007, -1.088, 5.6268 );
vec3 LUVToRGB( const in vec4 vLogLuv ) {
    float Le = vLogLuv.z * 255.0 + vLogLuv.w;
    vec3 Xp_Y_XYZp;
    Xp_Y_XYZp.y = exp2((Le - 127.0) / 2.0);
    Xp_Y_XYZp.z = Xp_Y_XYZp.y / vLogLuv.y;
    Xp_Y_XYZp.x = vLogLuv.x * Xp_Y_XYZp.z;
    vec3 vRGB = LUVInverse * Xp_Y_XYZp;
    return max(vRGB, 0.0);
}
vec4 encodeRGBM(const in vec3 color, const in float range) {
    if(range <= 0.0) return vec4(color, 1.0);
    vec4 rgbm;
    vec3 col = color / range;
    rgbm.a = clamp( max( max( col.r, col.g ), max( col.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = col / rgbm.a;
    return rgbm;
}
vec3 decodeRGBM(const in vec4 color, const in float range) {
    if(range <= 0.0) return color.rgb;
    return range * color.rgb * color.a;
}
vec3 getMaterialAlbedo() {
    vec3 albedo;
    albedo = uAlbedoPBRFactor * (texture2D(Texture0, vec2(0.125, 0.5)).rgb);
    return albedo;
}
float getMaterialMetalness() {
    return uMetalnessPBRFactor;
}
float getMaterialF0() {
    return specularF0Factor;
}
float getMaterialRoughness() {
    return uRoughnessPBRFactor;
}
vec3 getMaterialEmitColor() {
    return uEmitColorFactor * (texture2D(Texture0, vec2(0.375, 0.5)).rgb);
}
int decodeProfile(const in vec4 pack) {
    float packValue = floor(pack.b * 255.0 + 0.5);
    float profile = mod(packValue, 2.0);
    profile += mod(packValue - profile, 4.0);
    return int(profile);
}
float decodeDepth(const in vec4 pack) {
    if(decodeProfile(pack) == 0) {
        const vec3 decode = 1.0 / vec3(1.0, 255.0, 65025.0);
        return dot(pack.rgb, decode);
    }
    return pack.r + pack.g / 255.0;
}
float decodeScatter(const in vec4 pack) {
    float scatter = pack.b - mod(pack.b, 4.0 / 255.0);
    return scatter * 255.0 / 4.0 / 63.0;
}
float decodeAlpha(const in vec4 pack) {
    return pack.a;
}
float distanceToDepth(const in sampler2D depth, const in vec2 uv, const in vec4 viewPos, const vec2 nearFar) {
    float fragDepth = clamp( (-viewPos.z * viewPos.w - nearFar.x) / (nearFar.y - nearFar.x), 0.0, 1.0);
    return fragDepth - decodeDepth(texture2D(depth, uv));
}
float pseudoRandom(const in vec2 fragCoord) {
    vec3 p3 = fract(vec3(fragCoord.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}
float interleavedGradientNoise(const in vec2 fragCoord, const in float frameMod) {
    vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(fragCoord.xy + frameMod * vec2(47.0, 17.0) * 0.695, magic.xy)));
}
float ditheringNoise(const in vec2 fragCoord, const in float frameMod) {
    float fm = frameMod;
    float dither5 = fract((fragCoord.x + fragCoord.y * 2.0 - 1.5 + fm) / 5.0);
    float noise = fract(dot(vec2(171.0, 231.0) / 71.0, fragCoord.xy));
    return (dither5 * 5.0 + noise) * (1.2 / 6.0);
}
void ditheringMaskingDiscard(
const in vec4 fragCoord, const in int dithering, const in float alpha, const in float factor, const in float thinLayer, const in float frameMod, const in vec2 nearFar, const in vec4 halton) {
    if (dithering ! = 1) {
        if (alpha < factor) discard;
        return;
    }
    float rnd;
    if (thinLayer == 0.0) {
        float linZ = (1.0 / fragCoord.w - nearFar.x) / (nearFar.y - nearFar.x);
        float sliceZ = floor(linZ * 500.0) / 500.0;
        rnd = interleavedGradientNoise(fragCoord.xy + sliceZ, frameMod);
    }
    else {
        rnd = pseudoRandom(fragCoord.xy + halton.xy * 1000.0 + fragCoord.z * (abs(halton.z) == 2.0 ? 1000.0 : 1.0));
    }
    if (alpha * factor < rnd) discard;
}
float decodeFloatRGBA(const in vec4 rgba) {
    return dot(rgba, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}
float getSingleFloatFromTex(const in sampler2D depths, const in vec2 uv) {
    return  decodeFloatRGBA(texture2D(depths, uv));
}
float texture2DCompare(const in sampler2D depths, const in vec2 uv, const in float compare, const in vec4 clampDimension) {
    float depth = getSingleFloatFromTex(depths, clamp(uv, clampDimension.xy, clampDimension.zw));
    return compare - depth;
}
float shadowInterleavedGradientNoise(const in vec2 fragCoord, const in float frameMod) {
    vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(fragCoord.xy + frameMod * vec2(47.0, 17.0) * 0.695, magic.xy)));
}
float texture2DShadowLerp(
const in sampler2D depths, const in vec2 size, const in vec2 uv, const in float compare, const in vec4 clampDimension, const in float jitter) {
    vec2 centroidCoord = uv / size.xy;
    if (jitter > 0.0) {
        centroidCoord += shadowInterleavedGradientNoise(gl_FragCoord.xy, jitter);
    }
    centroidCoord = centroidCoord + 0.5;
    vec2 f = fract(centroidCoord);
    vec2 centroidUV = floor(centroidCoord) * size.xy;
    vec4 fetches;
    const vec2 shift = vec2(1.0, 0.0);
    fetches.x = texture2DCompare(depths, centroidUV + size.xy * shift.yy, compare, clampDimension);
    fetches.y = texture2DCompare(depths, centroidUV + size.xy * shift.yx, compare, clampDimension);
    fetches.z = texture2DCompare(depths, centroidUV + size.xy * shift.xy, compare, clampDimension);
    fetches.w = texture2DCompare(depths, centroidUV + size.xy * shift.xx, compare, clampDimension);
    vec4 st = step(fetches, vec4(0.0));
    float a = mix(st.x, st.y, f.y);
    float b = mix(st.z, st.w, f.y);
    return mix(a, b, f.x);
}
float getShadowPCF(
const in sampler2D depths, const in vec2 size, const in vec2 uv, const in float compare, const in vec2 biasPCF, const in vec4 clampDimension, const in float jitter) {
    float res = 0.0;
    res += texture2DShadowLerp(depths, size, uv + biasPCF, compare, clampDimension, jitter);
    return res;
}
float shadowReceive(const in bool lighted, const in vec3 normalWorld, const in vec3 vertexWorld, const in sampler2D shadowTexture, const in vec2 shadowSize, const in vec3 shadowProjection, const in vec4 shadowViewRight, const in vec4 shadowViewUp, const in vec4 shadowViewLook, const in vec2 shadowDepthRange, const in float shadowBias, const in float jitter) {
    bool earlyOut = false;
    float shadow = 1.0;
    if (!lighted) {
        shadow = 0.0;
        earlyOut = true;
    }
    if (shadowDepthRange.x == shadowDepthRange.y) {
        earlyOut = true;
    }
    vec4 shadowVertexEye;
    vec4 shadowNormalEye;
    float shadowReceiverZ = 0.0;
    vec4 shadowVertexProjected;
    vec2 shadowUV;
    float N_Dot_L;
    float invDepthRange;
    if (!earlyOut) {
        shadowVertexEye.x = dot(shadowViewRight.xyz, vertexWorld.xyz) + shadowViewRight.w;
        shadowVertexEye.y = dot(shadowViewUp.xyz, vertexWorld.xyz) + shadowViewUp.w;
        shadowVertexEye.z = dot(shadowViewLook.xyz, vertexWorld.xyz) + shadowViewLook.w;
        shadowVertexEye.w = 1.0;
        shadowNormalEye.z = dot(shadowViewLook.xyz, normalWorld.xyz);
        N_Dot_L = shadowNormalEye.z;
        if (!earlyOut) {
            invDepthRange = 1.0 / (shadowDepthRange.y - shadowDepthRange.x);
            vec4 viewShadow = shadowVertexEye;
            if (shadowProjection.z == 0.0) {
                shadowVertexProjected.x = shadowProjection.x * viewShadow.x;
                shadowVertexProjected.y = shadowProjection.y * viewShadow.y;
                shadowVertexProjected.z = - viewShadow.z - (2.0 * shadowDepthRange.x * viewShadow.w);
                shadowVertexProjected.w = - viewShadow.z;
            }
            else {
                float nfNeg = 1.0 / (shadowDepthRange.x - shadowDepthRange.y);
                float nfPos = (shadowDepthRange.x + shadowDepthRange.y)*nfNeg;
                shadowVertexProjected.x = viewShadow.x / shadowProjection.x;
                shadowVertexProjected.y = viewShadow.y / shadowProjection.y;
                shadowVertexProjected.z = 2.0 * nfNeg* viewShadow.z + nfPos * viewShadow.w;
                shadowVertexProjected.w = viewShadow.w;
            }
            if (shadowVertexProjected.w < 0.0) {
                earlyOut = true;
            }

        }
        if (!earlyOut) {
            shadowUV.xy = shadowVertexProjected.xy / shadowVertexProjected.w;
            shadowUV.xy = shadowUV.xy * 0.5 + 0.5;
            if (any(bvec4 ( shadowUV.x > 1., shadowUV.x < 0., shadowUV.y > 1., shadowUV.y < 0.))) {
                earlyOut = true;
            }
            shadowReceiverZ = - shadowVertexEye.z;
            shadowReceiverZ = (shadowReceiverZ - shadowDepthRange.x) * invDepthRange;
            if(shadowReceiverZ < 0.0) {
                earlyOut = true;
            }

        }

    }
    vec2 shadowBiasPCF = vec2 (0.);
    shadowBiasPCF.x = clamp(dFdx(shadowReceiverZ) * shadowSize.x, -1.0, 1.0 );
    shadowBiasPCF.y = clamp(dFdy(shadowReceiverZ) * shadowSize.y, -1.0, 1.0 );
    vec4 clampDimension;
    clampDimension = vec4(0.0, 0.0, 1.0, 1.0);
    if (earlyOut) {

    }
    else {
        float depthBias = 0.05 * sqrt( 1.0 - N_Dot_L * N_Dot_L) / clamp(N_Dot_L, 0.0005, 1.0);
        depthBias = clamp(depthBias, 0.00005, 2.0 * shadowBias);
        shadowReceiverZ = clamp(shadowReceiverZ, 0.0, 1.0 -depthBias) - depthBias;
        float res = getShadowPCF(shadowTexture, shadowSize, shadowUV, shadowReceiverZ, shadowBiasPCF, clampDimension, jitter);
        shadow = res;
    }
    return shadow;
}
float getLightAttenuation(const in float dist, const in vec4 lightAttenuation) {
    float constant = lightAttenuation.x;
    float linear = lightAttenuation.y * dist;
    float quadratic = lightAttenuation.z * dist * dist;
    return 1.0 / (constant + linear + quadratic);
}
void precomputeSpot(
const in vec3 normal, const in vec3 viewVertex, const in vec3 lightViewDirection, const in vec4 lightAttenuation, const in vec3 lightViewPosition, const in float lightSpotCutOff, const in float lightSpotBlend, out float attenuation, out vec3 eyeLightDir, out float dotNL) {
    eyeLightDir = lightViewPosition - viewVertex;
    float dist = length(eyeLightDir);
    eyeLightDir = dist > 0.0 ? eyeLightDir / dist : vec3( 0.0, 1.0, 0.0 );
    float cosCurAngle = dot(-eyeLightDir, lightViewDirection);
    float spot = cosCurAngle * smoothstep(0.0, 1.0, (cosCurAngle - lightSpotCutOff) / lightSpotBlend);
    dotNL = dot(eyeLightDir, normal);
    attenuation = spot * getLightAttenuation(dist, lightAttenuation);
}
void precomputePoint(
const in vec3 normal, const in vec3 viewVertex, const in vec4 lightAttenuation, const in vec3 lightViewPosition, out float attenuation, out vec3 eyeLightDir, out float dotNL) {
    eyeLightDir = lightViewPosition - viewVertex;
    float dist = length(eyeLightDir);
    attenuation = getLightAttenuation(dist, lightAttenuation);
    eyeLightDir = dist > 0.0 ? eyeLightDir / dist :  vec3( 0.0, 1.0, 0.0 );
    dotNL = dot(eyeLightDir, normal);
}
void precomputeSun(
const in vec3 normal, const in vec3 lightViewDirection, out float attenuation, out vec3 eyeLightDir, out float dotNL) {
    attenuation = 1.0;
    eyeLightDir = -lightViewDirection;
    dotNL = dot(eyeLightDir, normal);
}
vec4 precomputeGGX(const in vec3 normal, const in vec3 eyeVector, const in float roughness) {
    float NoV = clamp(dot(normal, eyeVector), 0., 1.);
    float r2 = roughness * roughness;
    return vec4(r2, r2 * r2, NoV, NoV * (1.0 - r2));
}
float D_GGX(const vec4 precomputeGGX, const float NoH) {
    float a2 = precomputeGGX.y;
    float d = (NoH * a2 - NoH) * NoH + 1.0;
    return a2 / (3.141593 * d * d);
}
vec3 F_Schlick(const vec3 f0, const float f90, const in float VoH) {
    float VoH5 = pow(1.0 - VoH, 5.0);
    return f90 * VoH5 + (1.0 - VoH5) * f0;
}
float F_Schlick(const float f0, const float f90, const in float VoH) {
    return f0 + (f90 - f0) * pow(1.0 - VoH, 5.0);
}
float V_SmithCorrelated(const vec4 precomputeGGX, const float NoL) {
    float a = precomputeGGX.x;
    float smithV = NoL * (precomputeGGX.w + a);
    float smithL = precomputeGGX.z * (NoL * (1.0 - a) + a);
    return 0.5 / (smithV + smithL);
}
vec3 specularLobe(const vec4 precomputeGGX, const vec3 normal, const vec3 eyeVector, const vec3 eyeLightDir, const vec3 specular, const float NoL, const float f90) {
    vec3 H = normalize(eyeVector + eyeLightDir);
    float NoH = clamp(dot(normal, H), 0., 1.);
    float VoH = clamp(dot(eyeLightDir, H), 0., 1.);
    float D = D_GGX(precomputeGGX, NoH);
    float V = V_SmithCorrelated(precomputeGGX, NoL);
    vec3 F = F_Schlick(specular, f90, VoH);
    return (D * V * 3.141593) * F;
}
void computeLightLambertGGX(
const in vec3 normal, const in vec3 eyeVector, const in float NoL, const in vec4 precomputeGGX, const in vec3 diffuse, const in vec3 specular, const in float attenuation, const in vec3 lightColor, const in vec3 eyeLightDir, const in float f90, out vec3 diffuseOut, out vec3 specularOut, out bool lighted) {
    lighted = NoL > 0.0;
    if (lighted == false) {
        specularOut = diffuseOut = vec3(0.0);
        return;
    }
    vec3 colorAttenuate = attenuation * NoL * lightColor;
    specularOut = colorAttenuate * specularLobe(precomputeGGX, normal, eyeVector, eyeLightDir, specular, NoL, f90);
    diffuseOut = colorAttenuate * diffuse;
}
float V_SmithGGXCorrelated_Anisotropic(float at, float ab, float ToV, float BoV, float ToL, float BoL, float NoV, float NoL) {
    float lambdaV = NoL * length(vec3(at * ToV, ab * BoV, NoV));
    float lambdaL = NoV * length(vec3(at * ToL, ab * BoL, NoL));
    return 0.5 / (lambdaV + lambdaL);
}
float D_GGX_Anisotropic(const float at, const float ab, const float ToH, const float BoH, const float NoH) {
    float a2 = at * ab;
    vec3 d = vec3(ab * ToH, at * BoH, a2 * NoH);
    float x = a2 / dot(d, d);
    return a2 * (x * x) / 3.141593;
}
vec3 anisotropicLobe(
const vec4 precomputeGGX, const vec3 normal, const vec3 eyeVector, const vec3 eyeLightDir, const vec3 specular, const float NoL, const float f90, const in vec3 anisotropicT, const in vec3 anisotropicB, const in float anisotropy) {
    vec3 H = normalize(eyeVector + eyeLightDir);
    float NoH = clamp(dot(normal, H), 0., 1.);
    float NoV = clamp(dot(normal, eyeVector), 0., 1.);
    float VoH = clamp(dot(eyeLightDir, H), 0., 1.);
    float ToV = dot(anisotropicT, eyeVector);
    float BoV = dot(anisotropicB, eyeVector);
    float ToL = dot(anisotropicT, eyeLightDir);
    float BoL = dot(anisotropicB, eyeLightDir);
    float ToH = dot(anisotropicT, H);
    float BoH = dot(anisotropicB, H);
    float aspect = sqrt(1.0 - abs(anisotropy) * 0.9);
    if (anisotropy > 0.0) aspect = 1.0 / aspect;
    float at = precomputeGGX.x * aspect;
    float ab = precomputeGGX.x / aspect;
    float D = D_GGX_Anisotropic(at, ab, ToH, BoH, NoH);
    float V = V_SmithGGXCorrelated_Anisotropic(at, ab, ToV, BoV, ToL, BoL, NoV, NoL);
    vec3 F = F_Schlick(specular, f90, VoH);
    return (D * V * 3.141593) * F;
}
void computeLightLambertGGXAnisotropy(
const in vec3 normal, const in vec3 eyeVector, const in float NoL, const in vec4 precomputeGGX, const in vec3 diffuse, const in vec3 specular, const in float attenuation, const in vec3 lightColor, const in vec3 eyeLightDir, const in float f90, const in vec3 anisotropicT, const in vec3 anisotropicB, const in float anisotropy, out vec3 diffuseOut, out vec3 specularOut, out bool lighted) {
    lighted = NoL > 0.0;
    if (lighted == false) {
        specularOut = diffuseOut = vec3(0.0);
        return;
    }
    vec3 colorAttenuate = attenuation * NoL * lightColor;
    specularOut = colorAttenuate * anisotropicLobe(precomputeGGX, normal, eyeVector, eyeLightDir, specular, NoL, f90, anisotropicT, anisotropicB, anisotropy);
    diffuseOut = colorAttenuate * diffuse;
}
vec3 computeDiffuseSPH(const in vec3 normal) {
    vec3 n = environmentTransform * normal;
    vec3 result = diffuseSPH[0] +
    diffuseSPH[1] * n.y +
    diffuseSPH[2] * n.z +
    diffuseSPH[3] * n.x +
    diffuseSPH[4] * n.y * n.x +
    diffuseSPH[5] * n.y * n.z +
    diffuseSPH[6] * (3.0 * n.z * n.z - 1.0) +
    diffuseSPH[7] * (n.z * n.x) +
    diffuseSPH[8] * (n.x * n.x - n.y * n.y);
    return max(result, vec3(0.0));
}
vec3 integrateBRDF(const in vec3 specular, const in float roughness, const in float NoV, const in float f90) {
    vec4 rgba = texture2D(brdfLUT, vec2(NoV, roughness));
    float b = (rgba[3] * 65280.0 + rgba[2] * 255.0);
    float a = (rgba[1] * 65280.0 + rgba[0] * 255.0);
    const float div = 1.0 / 65535.0;
    return (specular * a + b * f90) * div;
}
float linRoughnessToMipmap(const in float roughnessLinear) {
    return sqrt(roughnessLinear);
}
vec3 prefilterEnvMapCube(const in float rLinear, const in vec3 R) {
    vec3 dir = R;
    float lod = min(prefilterMiplevel.x, linRoughnessToMipmap(rLinear) * prefilterMiplevel.y);
    float scale = 1.0 - exp2(lod) / prefilterSize.x;
    vec3 absDir = abs(dir);
    float M = max(max(absDir.x, absDir.y), absDir.z);
    if (absDir.x ! = M) dir.x *= scale;
    if (absDir.y ! = M) dir.y *= scale;
    if (absDir.z ! = M) dir.z *= scale;
    return LUVToRGB(textureCubeLodEXT(prefilterMap, dir, lod));
}
vec3 getSpecularDominantDir(const in vec3 N, const in vec3 R, const in float realRoughness) {
    float smoothness = 1.0 - realRoughness;
    float lerpFactor = smoothness * (sqrt(smoothness) + realRoughness);
    return mix(N, R, lerpFactor);
}
vec3 getPrefilteredEnvMapColor(const in vec3 normal, const in vec3 eyeVector, const in float roughness, const in vec3 frontNormal) {
    vec3 R = reflect(-eyeVector, normal);
    R = getSpecularDominantDir(normal, R, roughness);
    vec3 prefilteredColor = prefilterEnvMapCube(roughness, environmentTransform * R);
    float factor = clamp(1.0 + dot(R, frontNormal), 0.0, 1.0);
    prefilteredColor *= factor * factor;
    return prefilteredColor;
}
vec3 computeIBLSpecularUE4(const in vec3 normal, const in vec3 eyeVector, const in float roughness, const in vec3 specular, const in vec3 frontNormal, const in float f90) {
    float NoV = dot(normal, eyeVector);
    return getPrefilteredEnvMapColor(normal, eyeVector, roughness, frontNormal) * integrateBRDF(specular, roughness, NoV, f90);
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
float fetchDepthLod(const in vec2 uv, const in vec3 pixelSizePowLevel) {
    float depth = decodeDepth(texture2D(uTextureMipmapDepth, uv * uGlobalTexRatio));
    if (depth >= 1.0) return -cameraNearFar.y * 100.0;
    return -cameraNearFar.x - depth * (cameraNearFar.y - cameraNearFar.x);
}
vec4 fetchDepthLod(const in vec4 uv0, const in vec4 uv1, const in vec3 pixelSizePowLevel) {
    vec4 result = vec4(0.0);
    result.x = fetchDepthLod(uv0.xy, pixelSizePowLevel);
    result.y = fetchDepthLod(uv0.zw, pixelSizePowLevel);
    result.z = fetchDepthLod(uv1.xy, pixelSizePowLevel);
    result.w = fetchDepthLod(uv1.zw, pixelSizePowLevel);
    return result;
}
vec3 ssrViewToScreen(const in mat4 projection, const in vec3 viewVertex) {
    vec4 projected = projection * vec4(viewVertex, 1.0);
    return vec3(0.5 + 0.5 * projected.xy / projected.w, projected.w);
}
vec3 fetchColorLod(const in float level, const in vec2 uv) {
    vec3 pixelSizePowLevel = computeLodNearestPixelSizePowLevel(7.0 * level, 7.0, uPreviousGlobalTexSize);
    vec2 uvNearest = computeLodUVNearest(uv, pixelSizePowLevel);
    return decodeRGBM(texture2D(uTextureReflected, uvNearest * uPreviousGlobalTexRatio), 7.0);
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
    vec3 rayDirUV = ssrViewToScreen(uProjectionMatrix, vViewVertex.xyz + rayDirView * rayLen);
    rayDirUV.z = 1.0 / rayDirUV.z;
    rayDirUV -= rayOriginUV;
    float scaleMaxX = min(1.0, 0.99 * (1.0 - rayOriginUV.x) / max(1e-5, rayDirUV.x));
    float scaleMaxY = min(1.0, 0.99 * (1.0 - rayOriginUV.y) / max(1e-5, rayDirUV.y));
    float scaleMinX = min(1.0, 0.99 * rayOriginUV.x / max(1e-5, -rayDirUV.x));
    float scaleMinY = min(1.0, 0.99 * rayOriginUV.y / max(1e-5, -rayDirUV.y));
    return rayDirUV * min(scaleMaxX, scaleMaxY) * min(scaleMinX, scaleMinY);
}
vec4 rayTraceUnrealSimple(
const in vec3 rayOriginUV, const in float rayLen, in float depthTolerance, const in vec3 rayDirView, const in float roughness, const in float frameMod) {
    vec3 pixelSizePowLevel = computeLodNearestPixelSizePowLevel(5.0 * roughness, 5.0, uTextureReflectedSize);
    float invNumSteps = 1.0 / float(8);
    if (uQuality > 1.0) invNumSteps /= 2.0;
    depthTolerance *= invNumSteps;
    vec3 rayDirUV = computeRayDirUV(rayOriginUV, rayLen, rayDirView);
    float sampleTime = getStepOffset(frameMod) * invNumSteps + invNumSteps;
    vec3 diffSampleW = vec3(0.0, sampleTime, 1.0);
    vec3 sampleUV;
    float depth, depthDiff, timeLerp, hitTime;
    bool hit;
    sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
    depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
    depthDiff = -1.0 / sampleUV.z - depth;
    hit = abs(depthDiff + depthTolerance) < depthTolerance;
    timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
    hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
    diffSampleW.z = min(diffSampleW.z, hitTime);
    diffSampleW.x = depthDiff;
    diffSampleW.y += invNumSteps;
    sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
    depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
    depthDiff = -1.0 / sampleUV.z - depth;
    hit = abs(depthDiff + depthTolerance) < depthTolerance;
    timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
    hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
    diffSampleW.z = min(diffSampleW.z, hitTime);
    diffSampleW.x = depthDiff;
    diffSampleW.y += invNumSteps;
    sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
    depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
    depthDiff = -1.0 / sampleUV.z - depth;
    hit = abs(depthDiff + depthTolerance) < depthTolerance;
    timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
    hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
    diffSampleW.z = min(diffSampleW.z, hitTime);
    diffSampleW.x = depthDiff;
    diffSampleW.y += invNumSteps;
    sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
    depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
    depthDiff = -1.0 / sampleUV.z - depth;
    hit = abs(depthDiff + depthTolerance) < depthTolerance;
    timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
    hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
    diffSampleW.z = min(diffSampleW.z, hitTime);
    diffSampleW.x = depthDiff;
    diffSampleW.y += invNumSteps;
    sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
    depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
    depthDiff = -1.0 / sampleUV.z - depth;
    hit = abs(depthDiff + depthTolerance) < depthTolerance;
    timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
    hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
    diffSampleW.z = min(diffSampleW.z, hitTime);
    diffSampleW.x = depthDiff;
    diffSampleW.y += invNumSteps;
    sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
    depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
    depthDiff = -1.0 / sampleUV.z - depth;
    hit = abs(depthDiff + depthTolerance) < depthTolerance;
    timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
    hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
    diffSampleW.z = min(diffSampleW.z, hitTime);
    diffSampleW.x = depthDiff;
    diffSampleW.y += invNumSteps;
    sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
    depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
    depthDiff = -1.0 / sampleUV.z - depth;
    hit = abs(depthDiff + depthTolerance) < depthTolerance;
    timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
    hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
    diffSampleW.z = min(diffSampleW.z, hitTime);
    diffSampleW.x = depthDiff;
    diffSampleW.y += invNumSteps;
    sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
    depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
    depthDiff = -1.0 / sampleUV.z - depth;
    hit = abs(depthDiff + depthTolerance) < depthTolerance;
    timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
    hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
    diffSampleW.z = min(diffSampleW.z, hitTime);
    diffSampleW.x = depthDiff;
    diffSampleW.y += invNumSteps;
    if (uQuality > 1.0) {
        sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
        depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
        depthDiff = -1.0 / sampleUV.z - depth;
        hit = abs(depthDiff + depthTolerance) < depthTolerance;
        timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
        hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
        diffSampleW.z = min(diffSampleW.z, hitTime);
        diffSampleW.x = depthDiff;
        diffSampleW.y += invNumSteps;
        sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
        depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
        depthDiff = -1.0 / sampleUV.z - depth;
        hit = abs(depthDiff + depthTolerance) < depthTolerance;
        timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
        hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
        diffSampleW.z = min(diffSampleW.z, hitTime);
        diffSampleW.x = depthDiff;
        diffSampleW.y += invNumSteps;
        sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
        depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
        depthDiff = -1.0 / sampleUV.z - depth;
        hit = abs(depthDiff + depthTolerance) < depthTolerance;
        timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
        hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
        diffSampleW.z = min(diffSampleW.z, hitTime);
        diffSampleW.x = depthDiff;
        diffSampleW.y += invNumSteps;
        sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
        depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
        depthDiff = -1.0 / sampleUV.z - depth;
        hit = abs(depthDiff + depthTolerance) < depthTolerance;
        timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
        hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
        diffSampleW.z = min(diffSampleW.z, hitTime);
        diffSampleW.x = depthDiff;
        diffSampleW.y += invNumSteps;
        sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
        depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
        depthDiff = -1.0 / sampleUV.z - depth;
        hit = abs(depthDiff + depthTolerance) < depthTolerance;
        timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
        hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
        diffSampleW.z = min(diffSampleW.z, hitTime);
        diffSampleW.x = depthDiff;
        diffSampleW.y += invNumSteps;
        sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
        depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
        depthDiff = -1.0 / sampleUV.z - depth;
        hit = abs(depthDiff + depthTolerance) < depthTolerance;
        timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
        hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
        diffSampleW.z = min(diffSampleW.z, hitTime);
        diffSampleW.x = depthDiff;
        diffSampleW.y += invNumSteps;
        sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
        depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
        depthDiff = -1.0 / sampleUV.z - depth;
        hit = abs(depthDiff + depthTolerance) < depthTolerance;
        timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
        hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
        diffSampleW.z = min(diffSampleW.z, hitTime);
        diffSampleW.x = depthDiff;
        diffSampleW.y += invNumSteps;
        sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
        depth = fetchDepthLod(sampleUV.xy, pixelSizePowLevel);
        depthDiff = -1.0 / sampleUV.z - depth;
        hit = abs(depthDiff + depthTolerance) < depthTolerance;
        timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
        hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
        diffSampleW.z = min(diffSampleW.z, hitTime);
        diffSampleW.x = depthDiff;
        diffSampleW.y += invNumSteps;
    }
    return vec4(rayOriginUV + rayDirUV * diffSampleW.z, 1.0 - diffSampleW.z);
}
vec4 fetchColorContribution(
in vec4 resRay, const in float maskSsr, const in vec3 specularEnvironment, const in vec3 specularColor, const in float roughness) {
    vec4 AB = mix(outputFovInfo[0], outputFovInfo[1], resRay.x);
    resRay.xyz = vec3(mix(AB.xy, AB.zw, resRay.y), 1.0) * -1.0 / resRay.z;
    resRay.xyz = (reprojViewProjMatrix * vec4(resRay.xyz, 1.0)).xyw;
    resRay.xy /= resRay.z;
    float maskEdge = clamp(6.0 - 6.0 * max(abs(resRay.x), abs(resRay.y)), 0.0, 1.0);
    resRay.xy = 0.5 + 0.5 * resRay.xy;
    vec3 fetchColor = specularColor * fetchColorLod(roughness * (1.0 - resRay.w), resRay.xy);
    return vec4(mix(specularEnvironment, fetchColor, maskSsr * maskEdge), 1.0);
}
vec3 ssr(const in vec3 specularEnvironment, const in vec3 specularColor, const in float roughness, const in vec3 normal, const in vec3 eyeVector) {
    vec4 result = vec4(0.0);
    float rough4 = roughness * roughness;
    rough4 = rough4 * rough4;
    vec3 upVector = abs(normal.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangentX = normalize(cross(upVector, normal));
    vec3 tangentY = cross(normal, tangentX);
    float maskSsr = ssrFactor * clamp(-4.0 * dot(eyeVector, normal) + 3.8, 0.0, 1.0);
    maskSsr *= clamp(4.7 - roughness * 5.0, 0.0, 1.0);
    vec3 rayOriginUV = ssrViewToScreen(uProjectionMatrix, vViewVertex.xyz);
    rayOriginUV.z = 1.0 / rayOriginUV.z;
    vec3 rayDirView = unrealImportanceSampling(uFrameModTaaSS, tangentX, tangentY, normal, eyeVector, rough4);
    float rayLen = mix(cameraNearFar.y + vViewVertex.z, -vViewVertex.z - cameraNearFar.x, rayDirView.z * 0.5 + 0.5);
    float depthTolerance = 0.5 * rayLen;
    if (dot(rayDirView, normal) > 0.001 && maskSsr > 0.0) {
        vec4 resRay = rayTraceUnrealSimple(rayOriginUV, rayLen, depthTolerance, rayDirView, roughness, uFrameModTaaSS);
        if (resRay.w > 0.0) result += fetchColorContribution(resRay, maskSsr, specularEnvironment, specularColor, roughness);
    }
    return result.w > 0.0 ? result.rgb / result.w : specularEnvironment;
}
float specularOcclusion(const in int occlude, const in float ao, const in vec3 normal, const in vec3 eyeVector) {
    if (occlude == 0) return 1.0;
    float d = dot(normal, eyeVector) + ao;
    return clamp((d * d) - 1.0 + ao, 0.0, 1.0);
}
float adjustRoughnessNormalMap(const in float roughness, const in vec3 normal) {
    float nlen2 = dot(normal, normal);
    if (nlen2 < 1.0) {
        float nlen = sqrt(nlen2);
        float kappa = (3.0 * nlen -  nlen2 * nlen) / (1.0 - nlen2);
        return min(1.0, sqrt(roughness * roughness + 1.0 / kappa));
    }
    return roughness;
}
vec3 computeAnisotropicBentNormal(const in vec3 normal, const in vec3 eyeVector, const in float roughness, const in vec3 anisotropicT, const in vec3 anisotropicB, const in float anisotropy) {
    vec3 anisotropyDirection = anisotropy >= 0.0 ? anisotropicB : anisotropicT;
    vec3 anisotropicTangent = cross(anisotropyDirection, eyeVector);
    vec3 anisotropicNormal = cross(anisotropicTangent, anisotropyDirection);
    float bendFactor = abs(anisotropy) * clamp(5.0 * roughness, 0.0, 1.0);
    return normalize(mix(normal, anisotropicNormal, bendFactor));
}
void main() {
    vec3 eyeVector = -normalize(vViewVertex.xyz);
    vec3 frontNormal = normalize(gl_FrontFacing ? vViewNormal : -vViewNormal);
    float f0 = 0.08 * getMaterialF0();
    float metal = getMaterialMetalness();
    vec3 materialDiffuse = getMaterialAlbedo();
    vec3 materialSpecular = mix(vec3(f0), materialDiffuse, metal);
    materialDiffuse *= 1.0 - metal;
    float materialF90 = clamp(50.0 * materialSpecular.g, 0.0, 1.0);
    float materialRoughness = getMaterialRoughness();
    vec3 materialEmit = getMaterialEmitColor();
    vec3 materialNormal = frontNormal;
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0);
    vec3 bentAnisotropicNormal = materialNormal;
    diffuse = materialDiffuse * computeDiffuseSPH(materialNormal);
    specular = computeIBLSpecularUE4(bentAnisotropicNormal, eyeVector, materialRoughness, materialSpecular, frontNormal, materialF90);
    float aoSpec = 1.0;
    diffuse *= uEnvironmentExposure;
    specular *= uEnvironmentExposure;
    specular = ssr(specular, materialSpecular * aoSpec, materialRoughness, bentAnisotropicNormal, eyeVector);
    float attenuation, dotNL;
    vec3 eyeLightDir;
    bool lighted;
    vec3 lightSpecular;
    vec3 lightDiffuse;
    vec4 prepGGX = precomputeGGX(materialNormal, eyeVector, max(0.045, materialRoughness));
    float shadow;
    vec3 modelNormal = normalize(gl_FrontFacing ? vModelNormal : -vModelNormal);
    precomputeSun(materialNormal, uSketchfabLight3_viewDirection, attenuation, eyeLightDir, dotNL);
    computeLightLambertGGX(materialNormal, eyeVector, dotNL, prepGGX, materialDiffuse, materialSpecular, attenuation, uSketchfabLight3_diffuse.rgb, eyeLightDir, materialF90, lightDiffuse, lightSpecular, lighted);
    shadow = shadowReceive(lighted, modelNormal, vModelVertex, Texture15, uShadow_Texture3_renderSize, uShadow_Texture3_projection, uShadow_Texture3_viewRight, uShadow_Texture3_viewUp, uShadow_Texture3_viewLook, uShadow_Texture3_depthRange, uShadowReceive3_bias, uStaticFrameNumShadow3);
    lightDiffuse *= shadow;
    lightSpecular *= shadow;
    diffuse += lightDiffuse;
    specular += lightSpecular;
    vec3 frag = diffuse + specular;
    frag = emitMultiplicative == 1 ? frag * materialEmit : frag + materialEmit;
    if (outputLinear ! = 1) frag = linearTosRGB(frag);
    gl_FragColor = encodeRGBM(frag, rgbmRange);
}
