#include <hsv_frag>
#include <srgb_frag>
#include <highlight_frag>
#include <snow_frag>
#include <mask_frag>
#include <terrain_normal_frag>
#include <vertex_color_frag>
#include <excavate_frag>
#include <compute_texcoord_frag>

#define PI 3.141593
#define RECIPROCAL_PI 0.3183099

struct MaterialUniforms {
    roughnessMetalness: vec2f,
    albedo: vec3f,
    alpha: f32,
    normal: vec3f,
    emit: vec3f,
    ao: f32,
    specularColor: vec3f,
    glossiness: f32,
    skinColor: vec4f
};

var<private> materialUniforms: MaterialUniforms;

struct SceneUniforms {
    alphaTest: f32,
    emissiveFactor: vec3f,
    baseColorFactor: vec4f,
    baseColorIntensity: f32,
    emitColorFactor: f32,
    occlusionFactor: f32,

    roughnessFactor: f32,
    metallicFactor: f32,
    normalMapFactor: f32,
    specularF0: f32,
    emitMultiplicative: f32,
    normalMapFlipY: f32,
    outputSRGB: f32,
    contrast: f32,

    hsv: vec3f,
    specularAAVariance: f32,
    specularAAThreshold: f32,

    #if HAS_SSR
        invProjMatrix: mat4x4f,
        outputFovInfo: array<vec4f, 2>,
        reprojViewProjMatrix: mat4x4f,
    #endif
    #ifndef HAS_COLOR
        #ifdef IS_LINE_EXTRUSION
        lineColor: vec4f,
        #else
        polygonFill: vec4f
        #endif
    #endif
};

struct ShaderUniforms {
    #if HAS_IBL_LIGHTING
        hdrHSV: vec3f,
        diffuseSPH: vec3f,
        prefilterMiplevel: vec2f,
        prefilterSize: vec2f,
    #else
        ambientColor: vec3f,
    #endif
    cameraPosition: vec3f,
    cameraNearFar: vec2f,
    environmentExposure: f32,
    environmentTransform: mat3x3f,

    light0_viewDirection: vec3f,
    light0_diffuse: vec4f,

    #if HAS_LAYER_OPACITY
        layerOpacity: f32,
    #endif

    #if HAS_SSR
        outSize: vec2f,
        ssrFactor: f32,
        ssrQuality: f32,
        projMatrix: mat4x4f,
    #endif
}

@group(0) @binding($b) var<uniform> uniforms: SceneUniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;

// Textures and samplers
#if HAS_ALBEDO_MAP
    @group(0) @binding($b) var baseColorTexture: texture_2d<f32>;
    @group(0) @binding($b) var baseColorSampler: sampler;
#endif
#if HAS_METALLICROUGHNESS_MAP
    @group(0) @binding($b) var metallicRoughnessTexture: texture_2d<f32>;
    @group(0) @binding($b) var metallicRoughnessSampler: sampler;
#endif
#if HAS_EMISSIVE_MAP
    @group(0) @binding($b) var emissiveTexture: texture_2d<f32>;
    @group(0) @binding($b) var emissiveSampler: sampler;
#endif
#if HAS_AO_MAP
    @group(0) @binding($b) var occlusionTexture: texture_2d<f32>;
    @group(0) @binding($b) var occlusionSampler: sampler;
#endif
#if HAS_NORMAL_MAP && HAS_TANGENT
    @group(0) @binding($b) var normalTexture: texture_2d<f32>;
    @group(0) @binding($b) var normalSampler: sampler;
#endif
#if HAS_SKIN_MAP
    @group(0) @binding($b) var skinTexture: texture_2d<f32>;
    @group(0) @binding($b) var skinSampler: sampler;
#endif
#if HAS_RANDOM_TEX
    @group(0) @binding($b) var noiseTexture: texture_2d<f32>;
    @group(0) @binding($b) var noiseSampler: sampler;
#endif
@group(0) @binding($b) var brdfLUT: texture_2d<f32>;
@group(0) @binding($b) var brdfLUTSampler: sampler;
#if HAS_IBL_LIGHTING
    @group(0) @binding($b) var prefilterMap: texture_cube<f32>;
    @group(0) @binding($b) var prefilterSampler: sampler;
#endif
#if HAS_SSR
    @group(0) @binding($b) var TextureDepth: texture_2d<f32>;
    @group(0) @binding($b) var TextureDepthSampler: sampler;
    @group(0) @binding($b) var TextureReflected: texture_2d<f32>;
    @group(0) @binding($b) var TextureReflectedSampler: sampler;
#endif
#if HAS_BUMP_MAP && HAS_TANGENT
    @group(0) @binding($b) var bumpTexture: texture_2d<f32>;
    @group(0) @binding($b) var bumpSampler: sampler;
#endif
#if HAS_PATTERN
    @group(0) @binding($b) var linePatternFile: texture_2d<f32>;
    @group(0) @binding($b) var linePatternSampler: sampler;
#endif

struct VertexOutput {

    #ifdef HAS_SSR
        @location($i) vViewNormal: vec3f,
        #ifdef HAS_TANGENT
            @location($i) vViewTangent: vec4f,
        #endif
    #endif

    @location($i) vModelNormal: vec3f,
    @location($i) vViewVertex: vec4f,

    #if HAS_TANGENT
        @location($i) vModelTangent: vec4f,
        @location($i) vModelBiTangent: vec3f,
    #endif

    @location($i) vModelVertex: vec3f,

    #if HAS_MAP
        @location($i) vTexCoord: vec2f,
        #ifdef HAS_AO_MAP
            @location($i) vTexCoord1: vec2f,
        #endif
        #ifdef HAS_I3S_UVREGION
            @location($i) vUvRegion: vec4f,
        #endif
    #endif

    #if HAS_COLOR
        @location($i) vColor: vec4f,
    #endif

        @location($i) vOpacity: f32,

    #if HAS_COLOR0
        @location($i) vColor0: vec4f,
    #endif

    #if HAS_BUMP_MAP && HAS_TANGENT
        @location($i) vTangentViewPos: vec3f,
        @location($i) vTangentFragPos: vec3f,
    #endif

};

fn getMaterialAlbedo() -> vec3f {
    return materialUniforms.albedo;
}

fn getMaterialAlpha() -> f32 {
    return materialUniforms.alpha;
}

fn getMaterialMetalness() -> f32 {
    return materialUniforms.roughnessMetalness.y;
}

fn getMaterialRoughness() -> f32 {
    #if SHADING_MODEL_SPECULAR_GLOSSINESS
        return 1.0 - materialUniforms.glossiness;
    #else
        return materialUniforms.roughnessMetalness.x;
    #endif
}

fn getMaterialEmitColor() -> vec3f {
    return materialUniforms.emit;
}

fn getMaterialSkinColor() -> vec4f {
    return materialUniforms.skinColor;
}

fn getMaterialNormalMap() -> vec3f {
    return materialUniforms.normal;
}

fn getMaterialOcclusion() -> f32 {
    return materialUniforms.ao;
}

fn decodeDepth(pack: vec4f) -> f32 {
    return pack.r + pack.g / 255.0;
}

fn transformNormal(factor: f32, normalToTransform: vec3f, t: vec3f, b: vec3f, n: vec3f) -> vec3f {
    let normal = vec3f(normalToTransform.xy * factor, normalToTransform.z);
    let tbn = mat3x3f(t, b, n);
    return normalize(tbn * normal);
}

fn D_GGX(roughness: f32, normal: vec3f, H: vec3f) -> f32 {
    let NoH = clamp(dot(normal, H), 0.0, 1.0);
    let a = roughness * roughness;
    let a2 = a * a;
    let d = (NoH * a2 - NoH) * NoH + 1.0;
    return a2 / ( PI * d * d);
}

fn F_Schlick(f0: vec3f, f90: f32, L: vec3f, H: vec3f) -> vec3f {
    var VoH = clamp(dot(L, H), 0.0, 1.0);
    VoH = pow(1.0 - VoH, 5.0);
    return f90 * VoH + (1.0 - VoH) * f0;
}

fn V_SmithGGXCorrelated(normal: vec3f, V: vec3f, roughness: f32, NoL: f32) -> f32 {
    let NoV = clamp(dot(normal, V), 0.0, 1.0);
    let a = roughness * roughness;
    let GGXL = NoV * (NoL * (1.0 - a) + a);
    let GGXV = NoL * (NoV * (1.0 - a) + a);
    return 0.5 / (GGXV + GGXL);
}

fn computeSpecularBRDF(roughness: f32, normal: vec3f, V: vec3f, L: vec3f, specular: vec3f, NoL: f32, f90: f32) -> vec3f {
    let H = normalize(V + L);
    let D = D_GGX(roughness, normal, H);
    let V_S = V_SmithGGXCorrelated(normal, V, roughness, NoL);
    let F = F_Schlick(specular, f90, L, H);
    return (D * V_S * PI) * F;
}

fn BRDF_Lambert(diffuseColor: vec3f) -> vec3f {
    return RECIPROCAL_PI * diffuseColor;
}

struct LambertLight {
    diffuse: vec3f,
    specular: vec3f
}

fn computeLambert(
    normal: vec3f,
    V: vec3f,
    NoL: f32,
    roughness: f32,
    materialDiffuse: vec3f,
    specular: vec3f,
    lightColor: vec3f,
    L: vec3f,
    f90: f32
) -> LambertLight {
    var lambert: LambertLight;
    if (NoL <= 0.0) {
        lambert.diffuse = vec3f(0.0);
        lambert.specular = vec3f(0.0);
        return lambert;
    }
    let a = NoL * lightColor;
    let brdf = computeSpecularBRDF(roughness, normal, V, L, specular, NoL, f90);

    lambert.specular = a * brdf;
    lambert.diffuse = a * BRDF_Lambert(materialDiffuse);
    return lambert;
}

#if HAS_IBL_LIGHTING
    fn computeDiffuseSPH(normal: vec3f) -> vec3f {
        let n = uniforms.environmentTransform * normal;
        let diffuseSPH = shaderUniforms.diffuseSPH;
        let x = n.x;
        let y = n.y;
        let z = n.z;
        let result = (
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
        if (length(shaderUniforms.hdrHSV) > 0.0) {
            return hsv_apply3(result, shaderUniforms.hdrHSV);
        }
        return max(result, vec3f(0.0));
    }

    fn fetchEnvMap(roughness: f32, R: vec3f) -> vec3f {
        let dir = R;
        let maxLevels = shaderUniforms.prefilterMiplevel.x;
        let lod = min(maxLevels, roughness * shaderUniforms.prefilterMiplevel.y);
        var envLight = textureSampleLevel(prefilterMap, prefilterSampler, dir, lod).rgb;
        if (length(shaderUniforms.hdrHSV) > 0.0) {
            envLight = hsv_apply3(envLight, shaderUniforms.hdrHSV);
        }
        return envLight;
    }

    fn getIBLEnvMap(N: vec3f, V: vec3f, roughness: f32, frontNormal: vec3f, materialDiffuse: vec3f) -> vec3f {
        let smoothness = 1.0 - roughness;
        let R = mix(N, reflect(-V, N), smoothness * (sqrt(smoothness) + roughness));

        let factor = clamp(1.0 + dot(R, frontNormal), 0.0, 1.0);

        let prefilteredEnvColor = fetchEnvMap(roughness, uniforms.environmentTransform * R) * factor * factor;
        return prefilteredEnvColor;
    }
#else
    fn getIBLEnvMap(normal: vec3f, eyeVector: vec3f, roughness: f32, frontNormal: vec3f, materialDiffuse: vec3f) -> vec3f {
        return shaderUniforms.ambientColor * BRDF_Lambert(materialDiffuse);
    }
#endif

fn computeBRDF(spec: vec3f, roughness: f32, NoV: f32, f90: f32) -> vec3f {
    let rgba = textureSample(brdfLUT, brdfLUTSampler, vec2f(NoV, roughness)) * vec4f(255.0, 65280.0, 255.0, 65280.0);
    let b = (rgba[3] + rgba[2]);
    let a = (rgba[1] + rgba[0]);
    return (spec * a + b * f90) / 65535.0;
}

fn computeIBLSpecular(
    normal: vec3f,
    eyeVector: vec3f,
    NoV: f32,
    roughness: f32,
    specular: vec3f,
    frontNormal: vec3f,
    f90: f32,
    materialDiffuse: vec3f
) -> vec3f {
    return getIBLEnvMap(normal, eyeVector, roughness, frontNormal, materialDiffuse) * computeBRDF(specular, roughness, NoV, f90);
}

fn computeSpecularAO(ao: f32, NoV: f32) -> f32 {
    let d = NoV + ao;
    return clamp((d * d) - 1.0 + ao, 0.0, 1.0);
}

fn initMaterial(vertexOutput: VertexOutput) -> MaterialUniforms {
    var materialUniforms: MaterialUniforms;
#ifdef HAS_MAP
    var uv = computeTexCoord(vertexOutput.vTexCoord);
#endif

#ifdef HAS_UV_FLIP
    uv.y = 1.0 - uv.y;
#endif

#if HAS_BUMP_MAP && HAS_TANGENT
    uv = bumpUV(uv, normalize(vertexOutput.vTangentViewPos - vertexOutput.vTangentFragPos));
#endif

    materialUniforms.albedo = uniforms.baseColorIntensity * uniforms.baseColorFactor.rgb;
    materialUniforms.alpha = uniforms.baseColorFactor.a * vertexOutput.vOpacity;

#if HAS_PATTERN
    // for tube
    var linesofar = vertexOutput.vLinesofar;
    let uvSize = vertexOutput.vTexInfo.zw;

#ifdef HAS_PATTERN_GAP
    let myGap = vertexOutput.vLinePatternGap;
#else
    let myGap = uniforms.linePatternGap;
#endif

#ifdef HAS_PATTERN_ANIM
    let myAnimSpeed = vertexOutput.vLinePatternAnimSpeed;
#else
    let myAnimSpeed = uniforms.linePatternAnimSpeed;
#endif

    // 这里是假设线或者tube纵向铺满整个图片，则根据比例缩放图片的宽度
    let patternWidth = ceil(uvSize.x * vertexOutput.vPatternHeight / uvSize.y);
    let plusGapWidth = patternWidth * (1.0 + myGap);
    let animSpeed = myAnimSpeed / uniforms.animSpeedScale;
    linesofar += (uniforms.currentTime * -animSpeed * 0.2) % plusGapWidth;
    let patternx = (linesofar / plusGapWidth) % 1.0;
    let patterny = (uniforms.flipY * vertexOutput.vNormalY) % 1.0;
    uv = computeUV(vec2(patternx * (1.0 + myGap) * uniforms.uvScale[0], patterny * uniforms.uvScale[1]));
    let patternColor = textureSample(linePatternFile, linePatternFileSampler, uv);
    let inGap = clamp(sign(1.0 / (1.0 + myGap) - patternx) + 0.000001, 0.0, 1.0);
    let patternColor = mix(uniforms.linePatternGapColor, patternColor, inGap);

#ifdef IS_SQUARE_TUBE
    // 当vNormal绝对值为1.0时，则不读取patternColor
    // vNormaly为1时，v为1，否则为0
    let v = clamp(sign(abs(vertexOutput.vNormalY) - 0.999999), 0.0, 1.0);
    let patternColor = mix(patternColor, vec4(1.0), v);
#endif

    materialUniforms.albedo *= patternColor.rgb;
    materialUniforms.alpha *= patternColor.a;
#endif

#if HAS_ALBEDO_MAP
    let baseColor = textureSample(baseColorTexture, baseColorTextureSampler, uv);
    materialUniforms.albedo *= sRGBToLinear(baseColor.rgb);
    materialUniforms.alpha *= baseColor.a;
#endif

#if HAS_SKIN_MAP
    let skinColorValue = textureSample(skinTexture, skinTextureSampler, uv);
    materialUniforms.skinColor = skinColorValue;
#endif

#if HAS_COLOR0
    materialUniforms.albedo *= vertexOutput.vColor0.rgb;
#if COLOR0_SIZE == 4
    materialUniforms.alpha *= vertexOutput.vColor0.a;
#endif
#endif

#if HAS_COLOR
    materialUniforms.albedo *= vertexOutput.vColor.rgb;
    materialUniforms.alpha *= vertexOutput.vColor.a;
#elif IS_LINE_EXTRUSION
    materialUniforms.albedo *= uniforms.lineColor.rgb;
    materialUniforms.alpha *= uniforms.lineColor.a;
#else
    materialUniforms.albedo *= uniforms.polygonFill.rgb;
    materialUniforms.alpha *= uniforms.polygonFill.a;
#endif

#if HAS_INSTANCE_COLOR
    materialUniforms.albedo *= vertexOutput.vInstanceColor.rgb;
    materialUniforms.alpha *= vertexOutput.vInstanceColor.a;
#endif

#if HAS_METALLICROUGHNESS_MAP
    let mrSample = textureSample(metallicRoughnessTexture, metallicRoughnessTextureSampler, uv).gb;
    materialUniforms.roughnessMetalness = mrSample * vec2(uniforms.roughnessFactor, uniforms.metallicFactor);
#else
    materialUniforms.roughnessMetalness = vec2(uniforms.roughnessFactor, uniforms.metallicFactor);
#endif

    materialUniforms.emit = uniforms.emissiveFactor;
#if HAS_EMISSIVE_MAP
    if (uniforms.emitMultiplicative == 1.0) {
        materialUniforms.emit *= sRGBToLinear(textureSample(emissiveTexture, emissiveTextureSampler, uv).rgb);
    } else {
        materialUniforms.emit += sRGBToLinear(textureSample(emissiveTexture, emissiveTextureSampler, uv).rgb);
    }
#endif
    materialUniforms.emit *= uniforms.emitColorFactor;

#if HAS_AO_MAP
    let aoTexCoord = computeTexCoord(vertexOutput.vTexCoord1);
    materialUniforms.ao = textureSample(occlusionTexture, occlusionTextureSampler, aoTexCoord).r;
#else
    materialUniforms.ao = 1.0;
#endif
    materialUniforms.ao *= uniforms.occlusionFactor;

#if HAS_NORMAL_MAP && HAS_TANGENT
    var nmap = textureSample(normalTexture, normalTextureSampler, uv).xyz * 2.0 - 1.0;
    nmap.y = select(nmap.y, -namp.y, uniforms.normalMapFlipY == 1.0);
    materialUniforms.normal = nmap;
#else
    materialUniforms.normal = normalize(vertexOutput.vModelNormal);
#endif

#if HAS_TERRAIN_NORMAL && HAS_TANGENT
    var nmap = convertTerrainHeightToNormalMap(uv);
    nmap.y = select(nmap.y, -namp.y, uniforms.normalMapFlipY == 1.0);
    materialUniforms.normal = nmap;
#endif

#if SHADING_MODEL_SPECULAR_GLOSSINESS
    materialUniforms.albedo *= uniforms.diffuseFactor.rgb;
    materialUniforms.alpha *= uniforms.diffuseFactor.a;
#if HAS_DIFFUSE_MAP
    let diffuse = textureSample(diffuseTexture, diffuseTextureSampler, uv);
    materialUniforms.albedo *= sRGBToLinear(diffuse.rgb);
    materialUniforms.alpha *= diffuse.a;
#endif

    materialUniforms.specularColor = uniforms.specularFactor;
    materialUniforms.glossiness = uniforms.glossinessFactor;
#if HAS_SPECULARGLOSSINESS_MAP
    let specularGlossiness = textureSample(specularGlossinessTexture, specularGlossinessTextureSampler, uv);
    materialUniforms.specularColor *= sRGBToLinear(specularGlossiness.rgb);
    materialUniforms.glossiness *= specularGlossiness.a;
#endif
#endif
    return materialUniforms;
}

fn HDR_ACES(x: vec3f) -> vec3f {
    // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
    const a = 2.51;
    const b = 0.03;
    const c = 2.43;
    const d = 0.59;
    const e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

fn tonemap(color: vec3f) -> vec3f {
    let tonemapped = HDR_ACES(color);
    return pow(tonemapped, vec3f(1.0/2.2));
}

fn normalFiltering(roughness: f32, worldNormal: vec3f) -> f32 {
    let du = dpdx(worldNormal);
    let dv = dpdy(worldNormal);

    let variance = uniforms.specularAAVariance * (dot(du, du) + dot(dv, dv));

    let kernelRoughness = min(2.0 * variance, uniforms.specularAAThreshold);
    let squareRoughness = saturate(roughness * roughness + kernelRoughness);

    return sqrt(squareRoughness);
}

#if HAS_SSR
    fn ssrViewToScreen(projection: mat4x4f, viewVertex: vec3f) -> vec3f {
        let projected = projection * vec4f(viewVertex, 1.0);
        return vec3f(0.5 + 0.5 * projected.xy / projected.w, projected.w);
    }

    fn fetchColorLod(level: f32, uv: vec2f) -> vec3f {
        return textureSampleLevel(TextureReflected, TextureReflectedSampler, uv, level).rgb;
    }

    fn linearizeDepth(depth: f32) -> f32 {
        let projection = uniforms.projMatrix;
        let z = depth * 2.0 - 1.0; // depth in clip space
        return -projection[3].z / (z + projection[2].z);
    }

    fn fetchDepth(uv: vec2f) -> f32 {
        let depth = decodeDepth(textureSample(TextureDepth, TextureDepthSampler, uv));
        return depth;
    }

    fn interleavedGradientNoise(fragCoord: vec2f, frameMod: f32) -> f32 {
        let magic = vec3f(0.06711056, 0.00583715, 52.9829189);
        return fract(magic.z * fract(dot(fragCoord.xy + frameMod * vec2f(47.0, 17.0) * 0.695, magic.xy))) * 0.5;
    }

    fn importanceSampling(
        frameMod: f32,
        tangentX: vec3f,
        tangentY: vec3f,
        tangentZ: vec3f,
        eyeVector: vec3f,
        rough4: f32
    ) -> vec3f {
        var E: vec2f;
        E.x = interleavedGradientNoise(fragCoord.yx, frameMod);
        E.y = fract(E.x * 52.9829189);
        E.y = mix(E.y, 1.0, 0.7);
        let phi = 2.0 * 3.14159 * E.x;
        let cosTheta = pow(max(E.y, 0.000001), rough4 / (2.0 - rough4));
        let sinTheta = sqrt(1.0 - cosTheta * cosTheta);
        var h = vec3f(sinTheta * cos(phi), sinTheta * sin(phi), cosTheta);
        h = h.x * tangentX + h.y * tangentY + h.z * tangentZ;
        return normalize((2.0 * dot(eyeVector, h)) * h - eyeVector);
    }

    fn getStepOffset(frameMod: f32) -> f32 {
        return (interleavedGradientNoise(fragCoord.xy, frameMod) - 0.5);
    }

    fn computeRayDirUV(rayOriginUV: vec3f, rayLen: f32, rayDirView: vec3f) -> vec3f {
        let rayDirUV = ssrViewToScreen(uniforms.projMatrix, vViewVertex.xyz + rayDirView * rayLen);
        rayDirUV.z = 1.0 / rayDirUV.z;
        rayDirUV -= rayOriginUV;
        let scaleMaxX = min(1.0, 0.99 * (1.0 - rayOriginUV.x) / max(1e-5, rayDirUV.x));
        let scaleMaxY = min(1.0, 0.99 * (1.0 - rayOriginUV.y) / max(1e-5, rayDirUV.y));
        let scaleMinX = min(1.0, 0.99 * rayOriginUV.x / max(1e-5, -rayDirUV.x));
        let scaleMinY = min(1.0, 0.99 * rayOriginUV.y / max(1e-5, -rayDirUV.y));
        return rayDirUV * min(scaleMaxX, scaleMaxY) * min(scaleMinX, scaleMinY);
    }

    fn binarySearch(rayOriginUV: vec3f, rayDirUV: vec3f, startSteps: ptr<function, f32>, endSteps: ptr<function, f32>) -> f32 {
        let steps = (*startSteps + *endSteps) * 0.5;
        let sampleUV = rayOriginUV + rayDirUV * steps;
        let z = fetchDepth(sampleUV.xy);
        let depth = linearizeDepth(z);
        let sampleDepth = -1.0 / sampleUV.z;
        *startSteps = select(steps, *startSteps, depth > sampleDepth);
        *endSteps = select(*endSteps, steps, depth > sampleDepth);
        return steps;
    }

    fn rayTrace(
        rayOriginUV: vec3f,
        rayLen: f32,
        depthTolerance: f32,
        rayDirView: vec3f,
        roughness: f32,
        frameMod: f32
    ) -> vec4f {
        let checkSteps = 20;
        let invNumSteps = 1.0 / f32(checkSteps);
        depthTolerance *= invNumSteps;
        let rayDirUV = computeRayDirUV(rayOriginUV, rayLen, rayDirView);
        let sampleTime = invNumSteps;
        var diffSampleW = vec3f(0.0, sampleTime, 1.0);
        var sampleUV: vec3f;
        var hit = false;
        var hitDepth = 1.0;
        var steps: f32;

        for (var i = 0; i < checkSteps; i++) {
            sampleUV = rayOriginUV + rayDirUV * diffSampleW.y;
            let z = fetchDepth(sampleUV.xy);
            let depth = linearizeDepth(z);
            let sampleDepth = -1.0 / sampleUV.z;
            let validDepth = clamp(sign(0.999 - z), 0.0, 1.0);
            var depthDiff = validDepth * (sampleDepth - depth);
            depthDiff *= clamp(sign(abs(depthDiff) - rayLen * invNumSteps * invNumSteps), 0.0, 1.0);
            hit = abs(depthDiff + depthTolerance) < depthTolerance;
            let timeLerp = clamp(diffSampleW.x / (diffSampleW.x - depthDiff), 0.0, 1.0);
            let hitTime = select(1.0, (diffSampleW.y + timeLerp * invNumSteps - invNumSteps), hit);
            diffSampleW.z = min(diffSampleW.z, hitTime);
            diffSampleW.x = depthDiff;
            if (hit) {
                var startSteps = diffSampleW.y - invNumSteps;
                var endSteps = diffSampleW.y;
                steps = binarySearch(rayOriginUV, rayDirUV, &startSteps, &endSteps);
                steps = binarySearch(rayOriginUV, rayDirUV, &startSteps, &endSteps);
                steps = binarySearch(rayOriginUV, rayDirUV, &startSteps, &endSteps);
                hitDepth = steps;
                break;
            }
            diffSampleW.y += invNumSteps;
        }

        return vec4f(rayOriginUV + rayDirUV * hitDepth, 1.0 - hitDepth);
    }

    fn fetchColorInRay(
        resRay: vec4f,
        maskSsr: f32,
        specularEnvironment: vec3f,
        specularColor: vec3f,
        roughness: f32
    ) -> vec4f {
        let AB = mix(uniforms.outputFovInfo[0], uniforms.outputFovInfo[1], resRay.x);
        resRay.xyz = vec3f(mix(AB.xy, AB.zw, resRay.y), 1.0) * -1.0 / resRay.z;
        resRay.xyz = (uniforms.reprojViewProjMatrix * vec4f(resRay.xyz, 1.0)).xyw;
        resRay.xy /= resRay.z;

        let maskEdge = clamp(6.0 - 6.0 * max(abs(resRay.x), abs(resRay.y)), 0.0, 1.0);
        resRay.xy = 0.5 + 0.5 * resRay.xy;
        let fetchColor = specularColor * fetchColorLod(roughness * (1.0 - resRay.w), resRay.xy);
        return vec4f(mix(specularEnvironment, fetchColor, maskSsr * maskEdge), 1.0);
    }

    fn ssr(
        specularEnvironment: vec3f,
        specularColor: vec3f,
        roughness: f32,
        normal: vec3f,
        eyeVector: vec3f
    ) -> vec3f {
        let taaSS = 0.0;
        var result = vec4f(0.0);
        var rough4 = roughness * roughness;
        rough4 = rough4 * rough4;
        let upVector = select(vec3f(1.0, 0.0, 0.0), vec3f(0.0, 0.0, 1.0), abs(normal.z) < 0.999);
        let tangentX = normalize(cross(upVector, normal));
        let tangentY = cross(normal, tangentX);
        var maskSsr = shaderUniforms.ssrFactor * clamp(-4.0 * dot(eyeVector, normal) + 3.8, 0.0, 1.0);
        maskSsr *= clamp(4.7 - roughness * 5.0, 0.0, 1.0);
        let rayOriginUV = ssrViewToScreen(shaderUniforms.projMatrix, vViewVertex.xyz);
        rayOriginUV.z = 1.0 / rayOriginUV.z;
        let rayDirView = importanceSampling(taaSS, tangentX, tangentY, normal, eyeVector, rough4);

        let rayLen = mix(shaderUniforms.cameraNearFar.y + vViewVertex.z, -vViewVertex.z - shaderUniforms.cameraNearFar.x, rayDirView.z * 0.5 + 0.5);
        let depthTolerance = 0.5 * rayLen;
        var resRay: vec4f;
        if (dot(rayDirView, normal) > 0.001 && maskSsr > 0.0) {
            resRay = rayTrace(rayOriginUV, rayLen, depthTolerance, rayDirView, roughness, taaSS);
            if (resRay.w > 0.0) {
                result += fetchColorInRay(resRay, maskSsr, specularEnvironment, specularColor, roughness);
            }
        }
        return select(specularEnvironment, result.rgb / result.w, result.w > 0.0);
    }
#endif

fn sRGBTransferOETF(value: vec4f) -> vec4f {
    let isLow: vec3<bool> = value.rgb <= vec3f(0.0031308);
    let highPart: vec3f = pow(value.rgb, vec3f(0.41666)) * 1.055 - vec3f(0.055);
    let lowPart: vec3f = value.rgb * 12.92;
    let rgb: vec3f = select(highPart, lowPart, isLow);
    return vec4f(rgb, value.a);
}

fn linearToOutputTexel(value: vec4f) -> vec4f {
    return sRGBTransferOETF(value);
}

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    materialUniforms = initMaterial(vertexOutput);

    var glFragColor: vec4f;


    // Main lighting calculations
    let eyeVector = normalize(shaderUniforms.cameraPosition - vertexOutput.vModelVertex);
    #if HAS_DOUBLE_SIDE
        let frontNormal = select(-normalize(vertexOutput.vModelNormal), normalize(vertexOutput.vModelNormal), gl_FrontFacing);
    #else
        let frontNormal = normalize(vertexOutput.vModelNormal);
    #endif

    let f0 = 0.08 * uniforms.specularF0;
    let metal = getMaterialMetalness();
    var materialDiffuse = getMaterialAlbedo();
    #if SHADING_MODEL_SPECULAR_GLOSSINESS
        let materialSpecular = materialUniforms.specularColor;
    #else
        let materialSpecular = mix(vec3f(f0), materialDiffuse, metal);
    #endif
    materialDiffuse *= 1.0 - metal;
    let materialF90 = clamp(50.0 * materialSpecular.g, 0.0, 1.0);
    var materialRoughness = getMaterialRoughness();

    if (uniforms.specularAAVariance > 0.0) {
        materialRoughness = normalFiltering(materialRoughness, frontNormal);
    }

    let materialEmit = getMaterialEmitColor();
    var materialNormal = getMaterialNormalMap();

    #if HAS_TANGENT
        #if HAS_NORMAL_MAP || HAS_TERRAIN_NORMAL
        materialNormal = transformNormal(uniforms.normalMapFactor, materialNormal, vertexOutput.vModelTangent.xyz, vertexOutput.vModelBiTangent, frontNormal);
        #endif
    #endif

    var diffuse = vec3f(0.0);
    var specular = vec3f(0.0);

    #if HAS_IBL_LIGHTING
        diffuse = materialDiffuse * computeDiffuseSPH(materialNormal) * 0.5;
    #else
        diffuse = materialDiffuse * shaderUniforms.ambientColor;
    #endif

    let NoV = dot(materialNormal, eyeVector);
    specular = computeIBLSpecular(materialNormal, eyeVector, NoV, materialRoughness, materialSpecular, frontNormal, materialF90, materialDiffuse);

    var specularAO = 1.0;
    let materialAO = getMaterialOcclusion();
    diffuse *= shaderUniforms.environmentExposure * materialAO;

    #if HAS_IBL_LIGHTING
        specularAO = computeSpecularAO(materialAO, NoV);
    #endif

    #if HAS_SSR
        var ssrfrontNormal = normalize(select(-vertexOutput.vViewNormal, vertexOutput.vViewNormal, gl_FrontFacing));
        var viewNormal = ssrfrontNormal;
        #if HAS_TANGENT
        #if HAS_NORMAL_MAP || HAS_TERRAIN_NORMAL
            var ssrTangent = select(-vertexOutput.vViewTangent, vertexOutput.vViewTangent, gl_FrontFacing);
            ssrTangent.xyz = normalize(ssrTangent.xyz);
            let ssrBinormal = normalize(cross(ssrfrontNormal, ssrTangent.xyz)) * ssrTangent.w;
            viewNormal = transformNormal(uniforms.normalMapFactor, materialNormal, ssrTangent.xyz, ssrBinormal, ssrfrontNormal);
        #endif
        #endif
        specular = ssr(specular, materialSpecular * specularAO, materialRoughness, viewNormal, -normalize(vertexOutput.vViewVertex.xyz));
    #endif

    specular *= shaderUniforms.environmentExposure * specularAO;

    let modelNormal = vertexOutput.vModelNormal;
    let lightDir = -shaderUniforms.light0_viewDirection;
    let dotNL = saturate(dot(lightDir, materialNormal));
    let lambertResult = computeLambert(materialNormal, eyeVector, dotNL, max(0.045, materialRoughness), materialDiffuse, materialSpecular, shaderUniforms.light0_diffuse.rgb, lightDir, materialF90);
    var ambientDiffuse = lambertResult.diffuse;
    var ambientSpecular = lambertResult.specular;

    #if HAS_SHADOWING && !HAS_BLOOM
        let shadowCoeff = shadow_computeShadow();
        ambientDiffuse = shadow_blend(ambientDiffuse, shadowCoeff).rgb;
        ambientSpecular = shadow_blend(ambientSpecular, shadowCoeff).rgb;
    #endif

    diffuse += ambientDiffuse;
    specular += ambientSpecular;
    diffuse += materialEmit;

    var frag = specular + diffuse;
    if (uniforms.outputSRGB == 1.0) {
        frag = linearTosRGB(frag);
    }

    #if HAS_SKIN_MAP
        let skinColor = getMaterialSkinColor();
        frag.rgb = frag.rgb * (1.0 - skinColor.a) + skinColor.rgb * skinColor.a;
        #if HAS_SHADOWING && !HAS_BLOOM
            frag.rgb = shadow_blend(frag.rgb, shadowCoeff).rgb;
        #endif
    #endif

    var alpha = getMaterialAlpha();
    if (alpha < uniforms.alphaTest) {
        discard;
    }

    #if ALPHA_MODE
        #if ALPHA_MODE == 1
            if (alpha < uniforms.alphaCutoff) {
                discard;
            } else {
                alpha = 1.0;
            }
        #else
            alpha = 1.0;
        #endif
    #endif

    glFragColor = vec4f(frag * alpha, alpha);

    // Apply various effects
    #ifdef HAS_VERTEX_COLOR
        glFragColor *= vertexColor_get(vertexOutput);
    #endif

    #ifdef HAS_EXCAVATE_ANALYSIS
        glFragColor = excavateColor(glFragColor);
    #endif


    #ifdef HAS_SNOW
        glFragColor.rgb = snow(glFragColor, getMaterialNormalMap(), 1.0);
    #endif

    if (uniforms.contrast != 1.0) {
        glFragColor = contrastMatrix(uniforms.contrast) * glFragColor;
    }

    if (length(uniforms.hsv) > 0.0) {
        glFragColor = hsv_apply4(glFragColor, uniforms.hsv);
    }

    #ifdef OUTPUT_NORMAL
        glFragColor = vec4f(frontNormal, 1.0);
    #endif

    #if HAS_HIGHLIGHT_OPACITY || HAS_HIGHLIGHT_COLOR
        glFragColor = highlight_blendColor(glFragColor, vertexOutput);
    #endif

    #ifdef HAS_LAYER_OPACITY
        glFragColor *= shaderUniforms.layerOpacity;
    #endif

    #ifdef HAS_MASK_EXTENT
        glFragColor = setMask(glFragColor);
    #endif

    return glFragColor;
}
