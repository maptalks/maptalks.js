#define PI 3.141593
#if __VERSION__ == 100
    #if defined(GL_EXT_shader_texture_lod)
        #extension GL_EXT_shader_texture_lod : enable
        #define textureCubeLod(tex, uv, lod) textureCubeLodEXT(tex, uv, lod)
    #else
        #define textureCubeLod(tex, uv, lod) textureCube(tex, uv, lod)
    #endif
    #if defined(GL_OES_standard_derivatives)
         #extension GL_OES_standard_derivatives : enable
    #endif
#else
    #define textureCubeLod(tex, uv, lod) textureLod(tex, uv, lod)
#endif
#define saturate(x)        clamp(x, 0.0, 1.0)
precision mediump float;
#include <gl2_frag>
#include <hsv_frag>
#include <srgb_frag>
uniform vec3 hsv;
uniform float contrast;

struct MaterialUniforms {
    vec2 roughnessMetalness;
    vec3 albedo;
    float alpha;
    vec3 normal;
    vec3 emit;
    float ao;

    //KHR_materials_pbrSpecularGlossiness
    vec3 specularColor;
    float glossiness;
    vec4 skinColor;
} materialUniforms;


#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
#include <vsm_shadow_frag>
#endif

uniform vec3 cameraPosition;
uniform float alphaTest;

#if defined(SHADING_MODEL_SPECULAR_GLOSSINESS)
    uniform vec4 diffuseFactor;
    uniform vec3 specularFactor;
    uniform float glossinessFactor;
    #if defined(HAS_DIFFUSE_MAP)
        uniform sampler2D diffuseTexture;
    #endif
    #if defined(HAS_SPECULARGLOSSINESS_MAP)
        uniform sampler2D specularGlossinessTexture;
    #endif
#endif

uniform vec3 emissiveFactor;
uniform vec4 baseColorFactor;

uniform float baseColorIntensity;
uniform float emitColorFactor;
uniform float occlusionFactor;
uniform float environmentExposure;
uniform float roughnessFactor;
uniform float metallicFactor;
uniform float normalMapFactor;
uniform float specularF0;
uniform int emitMultiplicative;
uniform int normalMapFlipY;
uniform int outputSRGB;
uniform mat3 environmentTransform;
#if defined(HAS_ALBEDO_MAP)
    uniform sampler2D baseColorTexture;
#endif
#if defined(HAS_METALLICROUGHNESS_MAP)
    uniform sampler2D metallicRoughnessTexture;
#endif
#if defined(HAS_EMISSIVE_MAP)
    uniform sampler2D emissiveTexture;
#endif
#if defined(HAS_AO_MAP)
    uniform sampler2D occlusionTexture;
    varying vec2 vTexCoord1;
#endif
#if defined(HAS_NORMAL_MAP) && defined(HAS_TANGENT)
    uniform sampler2D normalTexture;
#endif
#if defined(HAS_SKIN_MAP)
    uniform sampler2D skinTexture;
#endif

#if defined(ALPHA_MODE) && ALPHA_MODE == 1
    uniform float alphaCutoff;
#endif

#ifdef HAS_RANDOM_TEX
    uniform highp vec2 uvOrigin;
    uniform sampler2D noiseTexture;
#endif

uniform sampler2D brdfLUT;

#if defined(HAS_IBL_LIGHTING)
    uniform vec3 hdrHSV;
    uniform samplerCube prefilterMap;
    uniform vec3 diffuseSPH[9];
    uniform vec2 prefilterMiplevel;
    uniform vec2 prefilterSize;
#else
    uniform vec3 ambientColor;
#endif

uniform vec2 cameraNearFar;

uniform vec3 light0_viewDirection;
uniform vec4 light0_diffuse;
#ifdef HAS_SSR
    varying vec3 vViewNormal;
    #if defined(HAS_TANGENT)
        varying vec4 vViewTangent;
    #endif
#endif
varying vec3 vModelVertex;
varying vec4 vViewVertex;
#if defined(HAS_MAP)
    #include <computeTexcoord_frag>
#endif

varying vec3 vModelNormal;
#if defined(HAS_TANGENT)
    varying vec4 vModelTangent;
    varying vec3 vModelBiTangent;
#endif

#if defined(HAS_COLOR0)
    #if COLOR0_SIZE == 3
        varying vec3 vColor0;
    #else
        varying vec4 vColor0;
    #endif
#endif

#if defined(HAS_COLOR)
    varying vec4 vColor;
#elif defined(IS_LINE_EXTRUSION)
    uniform vec4 lineColor;
#else
    uniform vec4 polygonFill;
#endif
#ifdef HAS_LAYER_OPACITY
    uniform float layerOpacity;
#endif
varying float vOpacity;

#ifdef HAS_INSTANCE_COLOR
    varying vec4 vInstanceColor;
#endif

#ifdef IS_LINE_EXTRUSION
    uniform float lineOpacity;
#else
    uniform float polygonOpacity;
#endif


// LINE_PATTERN
#ifdef HAS_PATTERN
    uniform sampler2D linePatternFile;
    uniform vec2 atlasSize;
    uniform float flipY;
    uniform float currentTime;
    uniform float animSpeedScale;
    #ifdef HAS_PATTERN_ANIM
        varying float vLinePatternAnimSpeed;
    #else
        uniform float linePatternAnimSpeed;
    #endif
    #ifdef HAS_PATTERN_GAP
        varying float vLinePatternGap;
    #else
        uniform float linePatternGap;
    #endif
    uniform vec4 linePatternGapColor;
    uniform vec2 uvScale;

    varying float vPatternHeight;
    varying float vLinesofar;
    varying vec4 vTexInfo;
    varying float vNormalY;
    vec2 computeUV(vec2 texCoord) {
        vec2 uv = mod(texCoord, 1.0);
        vec2 uvStart = vTexInfo.xy;
        vec2 uvSize = vTexInfo.zw;
        return (uvStart + uv * uvSize) / atlasSize;
    }
#endif

#include <heatmap_render_frag>
#include <snow_frag>
#include <mask_frag>
#include <terrain_normal_frag>
#include <vertex_color_frag>
#include <excavate_frag>
#ifdef HAS_RANDOM_TEX
    const float mid = 0.5;

    vec2 rotateUV(vec2 uv, float rotation) {
        return vec2(
            cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
            cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
        );
    }
    float sum( vec3 v ) { return v.x+v.y+v.z; }
#endif

vec4 fetchTexture(sampler2D tex, in vec2 uv) {
    // https://iquilezles.org/www/articles/texturerepetition/texturerepetition.htm
    // technique 3
    #ifdef HAS_RANDOM_TEX
        highp vec2 origin = uvOrigin;
        // if (uvRotation != 0.0) {
        //     origin = rotateUV(origin, uvRotation);
        // }
        highp vec2 uv1 = uv + origin - mod(origin, 1.0);
        float randomSeed = texture2D(noiseTexture, 0.005 * uv1).x; // cheap (cache friendly) lookup

        vec2 duvdx = dFdx(uv1);
        vec2 duvdy = dFdx(uv1);

        float seed = randomSeed * 8.0;
        float seedFract = fract(seed);

    #if 1
        float seedDigit = floor(seed); // my method
        float seedDigitPlusOne = seedDigit + 1.0;
    #else
        float seedDigit = floor(seed + 0.5); // suslik's method (see comments)
        float seedDigitPlusOne = floor(seed);
        seedFract = min(seedFract, 1.0 - seedFract)*2.0;
    #endif

        vec2 offa = sin(vec2(3.0,7.0) * seedDigit); // can replace with any other hash
        vec2 offb = sin(vec2(3.0,7.0) * seedDigitPlusOne); // can replace with any other hash

        float velocity = 0.5;
        vec4 cola = texture2DGradEXT(tex, uv + velocity * offa, duvdx, duvdy);
        vec4 colb = texture2DGradEXT(tex, uv + velocity * offb, duvdx, duvdy);

        return mix(cola, colb, smoothstep(0.2, 0.8, seedFract - 0.1 * sum(cola.xyz - colb.xyz)));
    #else
        return texture2D(tex, uv);
    #endif
}

#if defined(HAS_BUMP_MAP) && defined(HAS_TANGENT)
    uniform sampler2D bumpTexture;
    // : 0.02
    uniform float bumpScale;
    //  : 20
    uniform float bumpMaxLayers;
    //  : 5
    uniform float bumpMinLayers;

    // Modified from http://apoorvaj.io/exploring-bump-mapping-with-webgl.html
    vec2 bumpUV(vec2 uv, vec3 viewDir) {
        // Determine number of layers from angle between V and N
        float numLayers = mix(bumpMaxLayers, bumpMinLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));
        float layerHeight = 1.0 / numLayers;
        float curLayerHeight = 0.0;
        vec2 deltaUv = viewDir.xy * bumpScale / (viewDir.z * numLayers);
        vec2 curUv = uv;

        float height = fetchTexture(bumpTexture, curUv).r;

        for (int i = 0; i < 30; i++) {
            curLayerHeight += layerHeight;
            curUv -= deltaUv;
            height = fetchTexture(bumpTexture, curUv).r;
            if (height < curLayerHeight) {
                break;
            }
        }

        // Parallax occlusion mapping
        vec2 prevUv = curUv + deltaUv;
        float next = height - curLayerHeight;
        float prev = fetchTexture(bumpTexture, prevUv).r - curLayerHeight + layerHeight;
        return mix(curUv, prevUv, next / (next - prev));
    }

    varying vec3 vTangentViewPos;
    varying vec3 vTangentFragPos;
#endif

#define SHADER_NAME PBR

vec3 getMaterialAlbedo() {
    // return sRGBToLinear(materialUniforms.albedo);
    return materialUniforms.albedo;
}
float getMaterialAlpha() {
    return materialUniforms.alpha;
}
float getMaterialMetalness() {
    // #if defined(SHADING_MODEL_SPECULAR_GLOSSINESS)
    //     vec3 color = materialUniforms.specularColor;
    //     return max(max(color.r, color.g), color.b);
    // #else
       return materialUniforms.roughnessMetalness.y;
    // #endif
}
float getMaterialRoughness() {
    #if defined(SHADING_MODEL_SPECULAR_GLOSSINESS)
        return 1.0 - materialUniforms.glossiness;
    #else
        return materialUniforms.roughnessMetalness.x;
    #endif
}
vec3 getMaterialEmitColor() {
    return materialUniforms.emit;
}
vec4 getMaterialSkinColor() {
    return materialUniforms.skinColor;
}
vec3 getMaterialNormalMap() {
    return materialUniforms.normal;
}

float getMaterialOcclusion() {
    return materialUniforms.ao;
}
float decodeDepth(const in vec4 pack) {
    return pack.r + pack.g / 255.0;
}

vec3 transformNormal(const in float factor, in vec3 normal, const in vec3 t, const in vec3 b, in vec3 n) {
    normal.xy = factor * normal.xy;
    mat3 tbn = mat3(t, b, n);
    return normalize(tbn * normal);
}
float D_GGX(const float roughness, const vec3 normal, const vec3 H) {
    float NoH = clamp(dot(normal, H), 0., 1.);
    float a = roughness * roughness;
    float a2 = a * a;
    float d = (NoH * a2 - NoH) * NoH + 1.0;
    return a2 / (PI * d * d);
}
vec3 F_Schlick(const vec3 f0, const float f90, const in vec3 L, const in vec3 H) {
    float VoH = clamp(dot(L, H), 0., 1.);
    VoH = pow(1.0 - VoH, 5.0);
    return f90 * VoH + (1.0 - VoH) * f0;
}

float V_SmithGGXCorrelated(const in vec3 normal, const in vec3 V, const in float roughness, const float NoL) {
    float NoV = clamp(dot(normal, V), 0., 1.);
    float a = roughness * roughness;
    float GGXL = NoV * (NoL * (1.0 - a) + a);
    float GGXV = NoL * (NoV * (1.0 - a) + a);
    return 0.5 / (GGXV + GGXL);
}

vec3 computeSpecularBRDF(const float roughness, const vec3 normal, const vec3 V, const vec3 L, const vec3 specular, const float NoL, const float f90) {
    vec3 H = normalize(V + L);
    float D = D_GGX(roughness, normal, H);
    float V_S = V_SmithGGXCorrelated(normal, V, roughness, NoL);
    vec3 F = F_Schlick(specular, f90, L, H);
    return (D * V_S * PI) * F;
}
void computeLambert(
const in vec3 normal, const in vec3 V, const in float NoL, const in float roughness,const in vec3 diffuse, const in vec3 specular, const in vec3 lightColor, const in vec3 L, const in float f90, out vec3 lightDiffuse, out vec3 lightSpecular) {
    if (NoL <= 0.0) {
        lightSpecular = lightDiffuse = vec3(0.0);
        return;
    }
    vec3 a = NoL * lightColor;
    vec3 brdf = computeSpecularBRDF(roughness, normal, V, L, specular, NoL, f90);

    lightSpecular = a * brdf;
    lightDiffuse = a * diffuse;
}

#if defined(HAS_IBL_LIGHTING)
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

    vec3 fetchEnvMap(const in float roughness, const in vec3 R) {
        vec3 dir = R;
        float maxLevels = prefilterMiplevel.x;
        float lod = min(maxLevels, roughness * prefilterMiplevel.y);
        vec3 envLight = textureCubeLod(prefilterMap, dir, lod).rgb;
        if (length(hdrHSV) > 0.0) {
            return hsv_apply(envLight, hdrHSV);
        } else {
            return envLight;
        }

        // return textureCubeLodEXT(prefilterMap, dir, lod).rgb;
    }

    vec3 getIBLEnvMap(const in vec3 N, const in vec3 V, const in float roughness, const in vec3 frontNormal) {
        float smoothness = 1.0 - roughness;
        vec3 R = mix(N, reflect(-V, N), smoothness * (sqrt(smoothness) + roughness));

        float factor = clamp(1.0 + dot(R, frontNormal), 0.0, 1.0);

        vec3 prefilteredEnvColor = fetchEnvMap(roughness, environmentTransform * R) * factor * factor;
        return prefilteredEnvColor;
    }
#else
    vec3 getIBLEnvMap(const in vec3 normal, const in vec3 eyeVector, const in float roughness, const in vec3 frontNormal) {
        return vec3(0.0);
    }
#endif
vec3 computeBRDF(const in vec3 spec, const in float roughness, const in float NoV, const in float f90) {
    vec4 rgba = texture2D(brdfLUT, vec2(NoV, roughness)) * vec4(255.0, 65280.0, 255.0, 65280.0);
    float b = (rgba[3] + rgba[2]);
    float a = (rgba[1] + rgba[0]);
    return (spec * a + b * f90) / 65535.0;

    // vec4 rgba = texture2D(brdfLUT, vec2(NoV, roughness));
    // return (specular * rgba.x + rgba.y * f90);
}
vec3 computeIBLSpecular(const in vec3 normal, const in vec3 eyeVector, const in float NoV, const in float roughness, const in vec3 specular, const in vec3 frontNormal, const in float f90) {
    return getIBLEnvMap(normal, eyeVector, roughness, frontNormal) * computeBRDF(specular, roughness, NoV, f90);
}

float computeSpecularAO(const in float ao, const in float NoV) {
    float d = NoV + ao;
    return clamp((d * d) - 1.0 + ao, 0.0, 1.0);
}

void initMaterial() {
    #ifdef HAS_MAP
    vec2 uv = computeTexCoord(vTexCoord);
    #endif
    #ifdef HAS_UV_FLIP
        uv.y = 1.0 - uv.y;
    #endif
    #if defined(HAS_BUMP_MAP) && defined(HAS_TANGENT)
        uv = bumpUV(uv, normalize(vTangentViewPos - vTangentFragPos));
    #endif
    materialUniforms.albedo = baseColorIntensity * baseColorFactor.rgb;
    materialUniforms.alpha = baseColorFactor.a * vOpacity;
    #if defined(HAS_PATTERN)
        // for tube
        float linesofar = vLinesofar;
        vec2 uvSize = vTexInfo.zw;
        #ifdef HAS_PATTERN_GAP
            float myGap = vLinePatternGap;
        #else
            float myGap = linePatternGap;
        #endif
        #ifdef HAS_PATTERN_ANIM
            float myAnimSpeed = vLinePatternAnimSpeed;
        #else
            float myAnimSpeed = linePatternAnimSpeed;
        #endif
        // 这里是假设线或者tube纵向铺满整个图片，则根据比例缩放图片的宽度
        float patternWidth = ceil(uvSize.x * vPatternHeight / uvSize.y);
        float plusGapWidth = patternWidth * (1.0 + myGap);
        myAnimSpeed /= animSpeedScale;
        linesofar += mod(currentTime * -myAnimSpeed * 0.2, plusGapWidth);
        float patternx = mod(linesofar / plusGapWidth, 1.0);
        float patterny = mod(flipY * vNormalY, 1.0);
        vec2 uv = computeUV(vec2(patternx * (1.0 + myGap) * uvScale[0], patterny * uvScale[1]));
        vec4 patternColor = texture2D(linePatternFile, uv);
        float inGap = clamp(sign(1.0 / (1.0 + myGap) - patternx) + 0.000001, 0.0, 1.0);
        patternColor = mix(linePatternGapColor, patternColor, inGap);
        #ifdef IS_SQUARE_TUBE
            // 当vNormal绝对值为1.0时，则不读取patternColor
            // vNormaly为1时，v为1，否则为0
            float v = clamp(sign(abs(vNormalY) - 0.999999), 0.0, 1.0);
            patternColor = mix(patternColor, vec4(1.0), v);
        #endif
        materialUniforms.albedo *= patternColor.rgb;
        materialUniforms.alpha *= patternColor.a;
    #endif
    #if defined(HAS_ALBEDO_MAP)
        vec4 baseColor = fetchTexture(baseColorTexture, uv);
        materialUniforms.albedo *= sRGBToLinear(baseColor.rgb);
        materialUniforms.alpha *= baseColor.a;
    #endif
    #if defined(HAS_SKIN_MAP)
        vec4 skinColorValue = fetchTexture(skinTexture, uv);
        materialUniforms.skinColor = skinColorValue;
    #endif
    #if defined(HAS_COLOR0)
        materialUniforms.albedo *= vColor0.rgb;
        #if COLOR0_SIZE == 4
            materialUniforms.alpha *= vColor0.a;
        #endif
    #endif
    #if defined(HAS_COLOR)
        materialUniforms.albedo *= vColor.rgb;
        materialUniforms.alpha *= vColor.a;
    #elif defined(IS_LINE_EXTRUSION)
        materialUniforms.albedo *= lineColor.rgb;
        materialUniforms.alpha *= lineColor.a;
    #else
        materialUniforms.albedo *= polygonFill.rgb;
        materialUniforms.alpha *= polygonFill.a;
    #endif
    #if defined(HAS_INSTANCE_COLOR)
        materialUniforms.albedo *= vInstanceColor.rgb;
        materialUniforms.alpha *= vInstanceColor.a;
    #endif
    #if defined(IS_LINE_EXTRUSION)
        materialUniforms.alpha *= lineOpacity;
    #else
        materialUniforms.alpha *= polygonOpacity;
    #endif


    #if defined(HAS_METALLICROUGHNESS_MAP)
        materialUniforms.roughnessMetalness = fetchTexture(metallicRoughnessTexture, uv).gb * vec2(roughnessFactor, metallicFactor);
    #else
        materialUniforms.roughnessMetalness = vec2(roughnessFactor, metallicFactor);
    #endif

    materialUniforms.emit = emissiveFactor;
    #if defined(HAS_EMISSIVE_MAP)
        if (emitMultiplicative == 1) {
            materialUniforms.emit *= sRGBToLinear(fetchTexture(emissiveTexture, uv).rgb);
        } else {
            materialUniforms.emit += sRGBToLinear(fetchTexture(emissiveTexture, uv).rgb);
        }
    #endif
    materialUniforms.emit *= emitColorFactor;

    #if defined(HAS_AO_MAP)
        vec2 aoTexCoord = computeTexCoord(vTexCoord1);
        materialUniforms.ao = fetchTexture(occlusionTexture, aoTexCoord).r;
    #else
        materialUniforms.ao = 1.0;
    #endif
    materialUniforms.ao *= occlusionFactor;

    #if defined(HAS_NORMAL_MAP) && defined(HAS_TANGENT)
        vec3 nmap = fetchTexture(normalTexture, uv).xyz * 2.0 - 1.0;
        nmap.y = normalMapFlipY == 1 ? -nmap.y : nmap.y;
        materialUniforms.normal = nmap;
    #else
        // vec3 dx = dFdx(vModelVertex);
        // vec3 dy = dFdy(vModelVertex);
        // materialUniforms.normal = normalize(cross(dx, dy));
        materialUniforms.normal = normalize(vModelNormal);
    #endif

    #if defined(HAS_TERRAIN_NORMAL) && defined(HAS_TANGENT)
        vec3 nmap = convertTerrainHeightToNormalMap(uv);
        nmap.y = normalMapFlipY == 1 ? -nmap.y : nmap.y;
        materialUniforms.normal = nmap;
    #endif

    #if defined(SHADING_MODEL_SPECULAR_GLOSSINESS)
        materialUniforms.albedo *= diffuseFactor.rgb;
        materialUniforms.alpha *= diffuseFactor.a;
        #if defined(HAS_DIFFUSE_MAP)
            vec4 diffuse = fetchTexture(diffuseTexture, uv);
            materialUniforms.albedo *= sRGBToLinear(diffuse.rgb);
            materialUniforms.alpha *= diffuse.a;
        #endif

        materialUniforms.specularColor = specularFactor;
        materialUniforms.glossiness = glossinessFactor;
        #if defined(HAS_SPECULARGLOSSINESS_MAP)
            vec4 specularGlossiness = fetchTexture(specularGlossinessTexture, uv);
            materialUniforms.specularColor *= sRGBToLinear(specularGlossiness.rgb);
            materialUniforms.glossiness *= specularGlossiness.a;
        #endif
    #endif
}

vec3 HDR_ACES(const vec3 x) {
    // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

vec3 tonemap(vec3 color) {
    // vec3 c = color;
    color = HDR_ACES(color);
    // HDR tonemapping
    // color = color / (color + vec3(1.0));
    // gamma correct
    return color = pow(color, vec3(1.0/2.2));
}

// Geometric Specular Antialiasing
uniform float specularAAVariance;
uniform float specularAAThreshold;

float normalFiltering(float roughness, const vec3 worldNormal) {
    #if defined(GL_OES_standard_derivatives) || __VERSION__ == 300
        // Kaplanyan 2016, "Stable specular highlights"
        // Tokuyoshi 2017, "Error Reduction and Simplification for Shading Anti-Aliasing"
        // Tokuyoshi and Kaplanyan 2019, "Improved Geometric Specular Antialiasing"

        // This implementation is meant for deferred rendering in the original paper but
        // we use it in forward rendering as well (as discussed in Tokuyoshi and Kaplanyan
        // 2019). The main reason is that the forward version requires an expensive transform
        // of the half vector by the tangent frame for every light. This is therefore an
        // approximation but it works well enough for our needs and provides an improvement
        // over our original implementation based on Vlachos 2015, "Advanced VR Rendering".

        vec3 du = dFdx(worldNormal);
        vec3 dv = dFdy(worldNormal);

        float variance = specularAAVariance * (dot(du, du) + dot(dv, dv));

        float kernelRoughness = min(2.0 * variance, specularAAThreshold);
        float squareRoughness = saturate(roughness * roughness + kernelRoughness);

        return sqrt(squareRoughness);
    #else
        return roughness;
    #endif
}

#ifdef HAS_SSR
    uniform sampler2D TextureDepth;
    uniform highp vec2 outSize;
    uniform float ssrFactor;
    uniform float ssrQuality;
    // uniform vec2 uPreviousGlobalTexSize;
    uniform sampler2D TextureReflected;
    // uniform vec2 uTextureReflectedSize;
    uniform highp mat4 projMatrix;
    uniform mat4 invProjMatrix;
    uniform vec4 outputFovInfo[2];
    uniform mat4 reprojViewProjMatrix;

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

    float interleavedGradientNoise(const in vec2 fragCoord, const in float frameMod) {
        vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
        return fract(magic.z * fract(dot(fragCoord.xy + frameMod * vec2(47.0, 17.0) * 0.695, magic.xy))) * 0.5;
    }

    vec3 importanceSampling(const in float frameMod, const in vec3 tangentX, const in vec3 tangentY, const in vec3 tangentZ, const in vec3 eyeVector, const in float rough4) {
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

    vec4 rayTrace(
    const in vec3 rayOriginUV, const in float rayLen, in float depthTolerance, const in vec3 rayDirView, const in float roughness, const in float frameMod) {
        int checkSteps = 20;
        // vec3 pixelSizePowLevel = computeLodNearestPixelSizePowLevel(5.0 * roughness, 5.0, uTextureReflectedSize);
        float invNumSteps = 1.0 / float(checkSteps);
        // if (ssrQuality > 1.0) invNumSteps /= 2.0;
        depthTolerance *= invNumSteps;
        //光线追踪方向的总的uv值
        vec3 rayDirUV = computeRayDirUV(rayOriginUV, rayLen, rayDirView);
        //sampleTime是一个与glFragCoord有关的随机值
        float sampleTime = /* getStepOffset(frameMod) * invNumSteps +  */invNumSteps;
        //diffSampleW中x是上一次的depthDiff，y是累计步长(invNumSteps累计值)，z是命中点的深度比例
        vec3 diffSampleW = vec3(0.0, sampleTime, 1.0);
        vec3 sampleUV;
        float z, depth, sampleDepth, depthDiff, timeLerp, hitTime;
        bool hit;
        float hitDepth = 1.0;
        float steps;
        // float thickness = ssrThickness;

        //以下为光线追踪过程，尝试找到离相机最近的命中点
        for (int i = 0; i < checkSteps; i++) {
            sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
            z = fetchDepth(sampleUV.xy);
            depth = linearizeDepth(z);
            sampleDepth = -1.0 / sampleUV.z;
            //z = 1时说明遇到了最远处的远视面，应该忽略这个depthDiff
            float validDepth = clamp(sign(0.999 - z), 0.0, 1.0);
            // if (abs(sampleDepth) >= abs(-depth + thickness)) {
            //     depthDiff = 0.0;
            // }
            // 下面的clamp相当于上面的逻辑
            // validDepth *= clamp(sign(abs(-depth + thickness) - abs(sampleDepth)), 0.0, 1.0);
            depthDiff = validDepth * (sampleDepth - depth);

            // 下面的clamp语句等同于这个if
            // 过滤掉 depthDiff 差值精度不高的像素，解决屏幕边缘的"阴影"现象。
            // if (abs(depthDiff) <= (rayLen * invNumSteps * invNumSteps)) {
            //     depthDiff = 0.0;
            // }
            depthDiff *= clamp(sign(abs(depthDiff) - rayLen * invNumSteps * invNumSteps), 0.0, 1.0);
            hit = abs(depthDiff + depthTolerance) < depthTolerance;
            timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
            hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
            diffSampleW.z = min(diffSampleW.z, hitTime);
            diffSampleW.x = depthDiff;
            if (hit) {
                // steps = diffSampleW.y;
                //二分法查找精确的命中点
                float startSteps = diffSampleW.y - invNumSteps;
                float endSteps = diffSampleW.y;
                steps = binarySearch(rayOriginUV, rayDirUV, startSteps, endSteps);
                steps = binarySearch(rayOriginUV, rayDirUV, startSteps, endSteps);
                steps = binarySearch(rayOriginUV, rayDirUV, startSteps, endSteps);
                // steps = binarySearch(rayOriginUV, rayDirUV, startSteps, endSteps);
                // steps = binarySearch(rayOriginUV, rayDirUV, startSteps, endSteps);
                hitDepth = steps;
                // hitDepth = diffSampleW.z;
                break;
            }
            diffSampleW.y += invNumSteps;
        }

        // hitDepth = diffSampleW.z;


        // if (ssrQuality > 1.0) {
        //     for (int i = 0; i < 8; i++) {
        //         sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
        //         z = fetchDepth(sampleUV.xy);
        //         depth = linearizeDepth(z);
        //         depthDiff = sign(1.0 - z) * (-1.0 / sampleUV.z - depth);
        //         hit = abs(depthDiff + depthTolerance) < depthTolerance;
        //         timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
        //         hitTime = hit ? (diffSampleW.y + timeLerp * invNumSteps - invNumSteps) : 1.0;
        //         diffSampleW.z = min(diffSampleW.z, hitTime);
        //         diffSampleW.x = depthDiff;
        //         diffSampleW.y += invNumSteps;
        //     }
        // }

        return vec4(rayOriginUV + rayDirUV * hitDepth, 1.0 - hitDepth);
    }

    vec4 fetchColorInRay(
    in vec4 resRay, const in float maskSsr, const in vec3 specularEnvironment, const in vec3 specularColor, const in float roughness) {
        //reproject
        vec4 AB = mix(outputFovInfo[0], outputFovInfo[1], resRay.x);
        //计算出camera space坐标
        resRay.xyz = vec3(mix(AB.xy, AB.zw, resRay.y), 1.0) * -1.0 / resRay.z;
        //reprojViewProjMatrix是 prevProjViewMatrix * cameraWorldMatrix
        //即用当前的 cameraWorldMatrix 计算出世界坐标 worldPoint
        //再用上一帧的矩阵 prevProjViewMatrix * worldPoint 计算出世界坐标在上一帧中对应的屏幕位置
        resRay.xyz = (reprojViewProjMatrix * vec4(resRay.xyz, 1.0)).xyw;
        resRay.xy /= resRay.z;

        float maskEdge = clamp(6.0 - 6.0 * max(abs(resRay.x), abs(resRay.y)), 0.0, 1.0);
        resRay.xy = 0.5 + 0.5 * resRay.xy;
        vec3 fetchColor = specularColor * fetchColorLod(roughness * (1.0 - resRay.w), resRay.xy);
        return vec4(mix(specularEnvironment, fetchColor, maskSsr * maskEdge), 1.0);
    }

    /**
     * @param specularEnvironment 环境光中的specular部分
     * @param specularColor 材质的specularColor
    */
    vec3 ssr(const in vec3 specularEnvironment, const in vec3 specularColor, const in float roughness, const in vec3 normal, const in vec3 eyeVector) {
        float taaSS = 0.0;
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
        vec3 rayDirView = importanceSampling(taaSS, tangentX, tangentY, normal, eyeVector, rough4);

        // rayDirView = reflect(-eyeVector, normal);
        //                  往远处方向的距离                往相机方向的距离           ray的方向（往远处还是往相机）
        float rayLen = mix(cameraNearFar.y + vViewVertex.z, -vViewVertex.z - cameraNearFar.x, rayDirView.z * 0.5 + 0.5);
        float depthTolerance = 0.5 * rayLen;
        vec4 resRay;
        if (dot(rayDirView, normal) > 0.001 && maskSsr > 0.0) {
            resRay = rayTrace(rayOriginUV, rayLen, depthTolerance, rayDirView, roughness, taaSS);
            if (resRay.w > 0.0) result += fetchColorInRay(resRay, maskSsr, specularEnvironment, specularColor, roughness);
        }
        // bool color = resRay.w > 0.0;
        // color = rayDirView.z > 0.9 && rayDirView.x < 0.1 && rayDirView.y < 0.1;
        // color = abs(normal.z) < 0.999;
        // color = dot(rayDirView, normal) > 0.001 && maskSsr > 0.0;

        //用于比较的depth是 1 / projected.w
        //如果从depth texture反算这个值
        // float delta = 1E4;
        // vec2 uv = gl_FragCoord.xy / outSize;
        // color = (floor(vViewVertex.z * delta) == floor(delta * fetchDepthLod(uv, vec3(0.0))));
        // vec4 projected = projMatrix * vViewVertex;
        // color = floor(delta * projected.z) == floor(delta * gl_FragCoord.z);
        // color = floor(delta * fetchDepthLod(uv, vec3(0.0))) == floor(delta * gl_FragCoord.z);
        // //成功
        // color = floor(1.0 / gl_FragCoord.w * delta) == floor((projMatrix * vec4(vViewVertex.xyz, 1.0)).w * delta);
        // //成功
        // color = floor(-vViewVertex.z * delta) == floor((projMatrix * vec4(vViewVertex.xyz, 1.0)).w * delta);
        // //成功
        // color = floor(delta * texture2D(TextureDepth, uv).r) == floor(delta * gl_FragCoord.z);
        //成功
        // color = floor(delta * -fetchDepthLod(uv, vec3(0.0))) == floor(delta * 1.0 / gl_FragCoord.w);

        // if (color) {
        //     return vec3(0.0, 1.0, 0.0);
        // } else {
        //     return vec3(1.0, 0.0, 0.0);
        // }
        return result.w > 0.0 ? result.rgb / result.w : specularEnvironment;
        // return result.w > 0.0 ? vec3(0.0, 1.0, 0.0) : specularEnvironment;
    }
#endif

#include <highlight_frag>

vec4 sRGBTransferOETF( in vec4 value ) {
    return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 linearToOutputTexel( vec4 value ) {
    return ( sRGBTransferOETF( value ) );
}

void main() {
    initMaterial();
    vec3 eyeVector = normalize(cameraPosition - vModelVertex.xyz);
#if defined(HAS_DOUBLE_SIDE)
    vec3 frontNormal = gl_FrontFacing ? normalize(vModelNormal) : -normalize(vModelNormal);
#else
    vec3 frontNormal = normalize(vModelNormal);
#endif
#if defined(HAS_TANGENT)
    vec4 tangent;
    tangent = vModelTangent;
    #if defined(HAS_DOUBLE_SIDE)
        tangent.xyz = gl_FrontFacing ? normalize(tangent.xyz) : -normalize(tangent.xyz);
    #else
        tangent.xyz = normalize(tangent.xyz);
    #endif
    // vec3 binormal = cross(frontNormal, tangent.xyz) * sign(tangent.w);
    vec3 binormal = normalize(vModelBiTangent);
#endif
    float f0 = 0.08 * specularF0;
    float metal = getMaterialMetalness();
    vec3 materialDiffuse = getMaterialAlbedo();
#if defined(SHADING_MODEL_SPECULAR_GLOSSINESS)
    vec3 materialSpecular = materialUniforms.specularColor;;
#else
    vec3 materialSpecular = mix(vec3(f0), materialDiffuse, metal);
#endif
    materialDiffuse *= 1.0 - metal;
    float materialF90 = clamp(50.0 * materialSpecular.g, 0.0, 1.0);
    float materialRoughness = getMaterialRoughness();
    if (specularAAVariance > 0.0) {
        materialRoughness = normalFiltering(materialRoughness, frontNormal);
    }
    vec3 materialEmit = getMaterialEmitColor();
    // float materialTranslucency = getMaterialTranslucency();
    // vec3 materialNormal = frontNormal;
    vec3 materialNormal0 = getMaterialNormalMap();
    vec3 materialNormal = vec3(materialNormal0);
    // materialRoughness = adjustRoughnessNormalMap(materialRoughness, materialNormal);
#if defined(HAS_TANGENT) && (defined(HAS_NORMAL_MAP) || defined(HAS_TERRAIN_NORMAL))
    materialNormal = transformNormal(normalMapFactor, materialNormal, tangent.xyz, binormal, frontNormal);
#endif
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0);

    #if defined(HAS_IBL_LIGHTING)
        diffuse = materialDiffuse * computeDiffuseSPH(materialNormal) * 0.5;
    #else
        diffuse = materialDiffuse * ambientColor;
    #endif
    float NoV = dot(materialNormal, eyeVector);
    specular = computeIBLSpecular(materialNormal, eyeVector, NoV, materialRoughness, materialSpecular, frontNormal, materialF90);
    float ccNoV;

    float specularAO = 1.0;
    float materialAO = getMaterialOcclusion();
    diffuse *= environmentExposure * materialAO;
    #ifdef HAS_IBL_LIGHTING
        specularAO = computeSpecularAO(materialAO, NoV);
    #endif
    #ifdef HAS_SSR
        vec3 ssrfrontNormal = normalize(gl_FrontFacing ? vViewNormal : -vViewNormal);
        vec3 viewNormal = ssrfrontNormal;
        #if defined(HAS_TANGENT) && (defined(HAS_NORMAL_MAP) || defined(HAS_TERRAIN_NORMAL))
            vec4 ssrTangent;
            ssrTangent = vViewTangent;
            ssrTangent = gl_FrontFacing ? ssrTangent : -ssrTangent;
            ssrTangent.xyz = normalize(ssrTangent.xyz);
            vec3 ssrBinormal = normalize(cross(ssrfrontNormal, ssrTangent.xyz)) * ssrTangent.w;
            viewNormal = transformNormal(normalMapFactor, materialNormal0, ssrTangent.xyz, ssrBinormal, ssrfrontNormal);
        #endif
        specular = ssr(specular, materialSpecular * specularAO, materialRoughness, viewNormal, -normalize(vViewVertex.xyz));
    #endif
    specular *= environmentExposure * specularAO;

    vec3 ambientSpecular, ambientDiffuse;
    vec3 modelNormal = vModelNormal;
    vec3 lightDir = -light0_viewDirection;
    float dotNL = dot(lightDir, materialNormal);
    computeLambert(materialNormal, eyeVector, dotNL, max(0.045, materialRoughness), materialDiffuse, materialSpecular, light0_diffuse.rgb, lightDir, materialF90, ambientDiffuse, ambientSpecular);

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        ambientDiffuse = shadow_blend(ambientDiffuse, shadowCoeff).rgb;
        ambientSpecular = shadow_blend(ambientSpecular, shadowCoeff).rgb;
    #endif

    diffuse += ambientDiffuse;
    specular += ambientSpecular;

    diffuse += materialEmit;
    // vec3 frag = mix(specular, diffuse, checkerboard(gl_FragCoord.xy, halton));
    vec3 frag = specular + diffuse;
    if (outputSRGB == 1) frag = linearTosRGB(frag);

    #ifdef HAS_SKIN_MAP
        vec4 skinColor = getMaterialSkinColor();
        frag.rgb = frag.rgb * (1.0 - skinColor.a) + skinColor.rgb * skinColor.a;
        #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
            frag.rgb = shadow_blend(frag.rgb, shadowCoeff).rgb;
        #endif
    #endif

    float alpha = getMaterialAlpha();
    #if defined(ALPHA_MODE)
        #if ALPHA_MODE == 1
            if (alpha < alphaCutoff) {
                discard;
            } else {
                alpha = 1.0;
            }
        #else
            alpha = 1.0;
        #endif
    #endif
    glFragColor = vec4(frag * alpha, alpha);
    if (glFragColor.a < alphaTest) {
        discard;
    }

    #ifdef HAS_VERTEX_COLOR
        glFragColor *= vertexColor_get();
    #endif
    // gl_FragColor = vec4(vec3(metal), 1.0);

// #if defined(HAS_TONE_MAPPING)
//     frag = linearTosRGB(frag);
//     // frag = tonemap(frag);
// #endif
    #ifdef HAS_EXCAVATE_ANALYSIS
        glFragColor = excavateColor(glFragColor);
    #endif

    #ifdef HAS_HEATMAP
        glFragColor = heatmap_getColor(glFragColor);
    #endif
    // gl_FragColor = vec4(shadowCoeff, shadowCoeff, shadowCoeff, 1.0);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // gl_FragColor = vec4(vColor.rgb, 1.0);
    // gl_FragColor = vec4(lightSpecular, 1.0);
    // gl_FragColor = vec4(ambientDiffuse, 1.0);
    // gl_FragColor = vec4(texture2D(normalTexture, vTexCoord).xyz, 1.0);
    // gl_FragColor = vec4(specular, 1.0);

    // #ifdef HAS_SSR
    //     gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // #endif
    // gl_FragColor = vec4(materialDiffuse * computeDiffuseSPH(materialNormal), 1.0);
    // gl_FragColor = vec4(vec3(shadow), 1.0);

    #ifdef HAS_SNOW
        glFragColor.rgb = snow(glFragColor, getMaterialNormalMap(), 1.0);
    #endif

    if (contrast != 1.0) {
        glFragColor = contrastMatrix(contrast) * glFragColor;
    }

    if (length(hsv) > 0.0) {
        glFragColor = hsv_apply(glFragColor, hsv);
    }

    #ifdef OUTPUT_NORMAL
        glFragColor = vec4(frontNormal, 1.0);
    #endif

    glFragColor = highlight_blendColor(glFragColor);

    #ifdef HAS_LAYER_OPACITY
        glFragColor *= layerOpacity;
    #endif

    // glFragColor = vec4(getMaterialNormalMap(), 1.0);

    // glFragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // glFragColor.rgb = materialNormal;

    // glFragColor = linearToOutputTexel(glFragColor);

    #ifdef HAS_MASK_EXTENT
        glFragColor = setMask(glFragColor);
    #endif
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
