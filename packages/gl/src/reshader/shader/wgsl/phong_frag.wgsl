struct LightUniforms {
    light0_viewDirection: vec3f,
    ambientColor: vec3f,
    light0_diffuse: vec4f,
    lightSpecular: vec3f,
    cameraPosition: vec3f,
    #ifdef HAS_LAYER_OPACITY
        layerOpacity: f32,
    #endif
};

struct MaterialUniforms {
    environmentExposure: f32,
    specularStrength: f32,
    baseColorFactor: vec4f,
    materialShininess: f32,
    alphaTest: f32,
#ifdef HAS_EXTRUSION_OPACITY
    extrusionOpacityRange: vec2f,
#endif
#ifdef SHADING_MODEL_SPECULAR_GLOSSINESS
    diffuseFactor: vec4f,
    specularFactor: vec3f,
#endif
#ifdef IS_LINE_EXTRUSION
    lineColor: vec4f,
    lineOpacity: f32,
#else
    polygonFill: vec4f,
    polygonOpacity: f32,
#endif
};

@group(0) @binding($b) var<uniform> lightUniforms: LightUniforms;
@group(0) @binding($b) var<uniform> materialUniforms: MaterialUniforms;

#ifdef HAS_BASECOLOR_MAP
@group(0) @binding($b) var baseColorTextureSampler: sampler;
@group(0) @binding($b) var baseColorTexture: texture_2d<f32>;
#endif

#ifdef HAS_AO_MAP
@group(0) @binding($b) var occlusionTextureSampler: sampler;
@group(0) @binding($b) var occlusionTexture: texture_2d<f32>;
#endif

#ifdef HAS_NORMAL_MAP
@group(0) @binding($b) var normalTextureSampler: sampler;
@group(0) @binding($b) var normalTexture: texture_2d<f32>;
#endif

#ifdef HAS_EMISSIVE_MAP
@group(0) @binding($b) var emissiveTextureSampler: sampler;
@group(0) @binding($b) var emissiveTexture: texture_2d<f32>;
#endif

#ifdef SHADING_MODEL_SPECULAR_GLOSSINESS
#ifdef HAS_DIFFUSE_MAP
@group(0) @binding($b) var diffuseTextureSampler: sampler;
@group(0) @binding($b0) var diffuseTexture: texture_2d<f32>;
#endif
#ifdef HAS_SPECULARGLOSSINESS_MAP
@group(0) @binding($b1) var specularGlossinessTextureSampler: sampler;
@group(0) @binding($b2) var specularGlossinessTexture: texture_2d<f32>;
#endif
#endif

#if HAS_SHADOWING && !HAS_BLOOM
#include <vsm_shadow_frag>
#endif
#include <highlight_frag>
#include <mask_frag>
#include <vertex_color_frag>
#ifdef HAS_MAP
    #include <compute_texcoord_frag>
#endif

fn transformNormal(vertexOutput: VertexOutput) -> vec3f {
#ifdef HAS_NORMAL_MAP
    let n = normalize(vertexOutput.vNormal);
    let normal = textureSample(normalTexture, normalTextureSampler, computeTexCoord(vertexOutput.vTexCoord, vertexOutput)).xyz * 2.0 - 1.0;
#ifdef HAS_TANGENT
    let t = normalize(vertexOutput.vTangent.xyz);
    let b = normalize(cross(n, t) * sign(vertexOutput.vTangent.w));
    let tbn = mat3x3f(t, b, n);
    return normalize(tbn * normal);
#else
    return normalize(normal);
#endif
#else
    return normalize(vertexOutput.vNormal);
#endif
}

fn getBaseColor(vertexOutput: VertexOutput) -> vec4f {
#ifdef HAS_BASECOLOR_MAP
    return textureSample(baseColorTexture, baseColorTextureSampler, computeTexCoord(vertexOutput.vTexCoord, vertexOutput));
#elif HAS_DIFFUSE_MAP
    return textureSample(diffuseTexture, diffuseTextureSampler, computeTexCoord(vertexOutput.vTexCoord, vertexOutput));
#elif SHADING_MODEL_SPECULAR_GLOSSINESS
    return materialUniforms.diffuseFactor;
#else
    return materialUniforms.baseColorFactor;
#endif
}

fn getSpecularColor(vertexOutput: VertexOutput) -> vec3f {
#ifdef HAS_SPECULARGLOSSINESS_MAP
    return textureSample(specularGlossinessTexture, specularGlossinessTextureSampler, computeTexCoord(vertexOutput.vTexCoord, vertexOutput)).rgb;
#elif SHADING_MODEL_SPECULAR_GLOSSINESS
    return materialUniforms.specularFactor;
#else
    return vec3f(1.0);
#endif
}

@fragment
fn main(vertexOutput: VertexOutput) ->  @location(0) vec4f {
    // 环境光
    let baseColor = getBaseColor(vertexOutput);
#ifdef SHADING_MODEL_UNLIT
    let ambientColor = vec3f(1.0);
#else
    let ambientColor = lightUniforms.ambientColor;
#endif
    var ambient = materialUniforms.environmentExposure * ambientColor * baseColor.rgb;

#ifdef HAS_INSTANCE_COLOR
    ambient *= vertexOutput.vInstanceColor.rgb;
#endif

    // 漫反射光
    let norm = transformNormal(vertexOutput);
    let lightDir = normalize(-lightUniforms.light0_viewDirection);
    var diff = max(dot(norm, lightDir), 0.0);
#ifdef SHADING_MODEL_UNLIT
    let lightDiffuse = vec3f(0.0);
#else
    let lightDiffuse = lightUniforms.light0_diffuse.rgb;
#endif
    var diffuse = lightDiffuse * diff * baseColor.rgb;

#if HAS_COLOR || HAS_COLOR0
    var color = vertexOutput.vColor.rgb;
#elif IS_LINE_EXTRUSION
    var color = materialUniforms.lineColor.rgb;
#else
    var color = materialUniforms.polygonFill.rgb;
#endif
#ifdef HAS_INSTANCE_COLOR
    color *= vertexOutput.vInstanceColor.rgb;
#endif
    ambient *= color.rgb;
    diffuse *= color.rgb;

    // 镜面反射光
    let viewDir = normalize(lightUniforms.cameraPosition - vertexOutput.vFragPos);
    let halfwayDir = normalize(lightDir + viewDir);
    var spec = pow(max(dot(norm, halfwayDir), 0.0), materialUniforms.materialShininess);
#ifdef SHADING_MODEL_UNLIT
    let lightSpecular = vec3f(0.0);
#else
    let lightSpecular = lightUniforms.lightSpecular;
#endif
    var specular = materialUniforms.specularStrength * lightSpecular * spec * getSpecularColor(vertexOutput);

#ifdef HAS_OCCLUSION_MAP
    let ao = textureSample(occlusionTexture, occlusionTextureSampler, computeTexCoord(vertexOutput.vTexCoord, vertexOutput1)).r;
    ambient *= ao;
#endif

#if HAS_SHADOWING && !HAS_BLOOM
    let shadowCoeff = shadow_computeShadow(vertexOutput);
    diffuse = shadow_blend(diffuse, shadowCoeff).rgb;
    specular = shadow_blend(specular, shadowCoeff).rgb;
    ambient = shadow_blend(ambient, shadowCoeff).rgb;
#endif

    var result = ambient + diffuse + specular;

#ifdef HAS_EMISSIVE_MAP
    let emit = textureSample(emissiveTexture, emissiveTextureSampler, computeTexCoord(vertexOutput.vTexCoord, vertexOutput)).rgb;
    result += emit;
#endif

#ifdef IS_LINE_EXTRUSION
    var fragColor = vec4f(result, materialUniforms.lineOpacity * baseColor.a);
#else
    var fragColor = vec4f(result, materialUniforms.polygonOpacity * baseColor.a);
#endif

#if HAS_COLOR || HAS_COLOR0
    let colorAlpha = vertexOutput.vColor.a;
#elif IS_LINE_EXTRUSION
    let colorAlpha = materialUniforms.lineColor.a;
#else
    let colorAlpha = materialUniforms.polygonFill.a;
#endif
    fragColor *= colorAlpha;

#ifdef HAS_EXTRUSION_OPACITY
    let topAlpha = materialUniforms.extrusionOpacityRange.x;
    let bottomAlpha = materialUniforms.extrusionOpacityRange.y;
    let alpha = topAlpha + vertexOutput.vExtrusionOpacity * (bottomAlpha - topAlpha);
    let alpha = clamp(alpha, 0.0, 1.0);
    fragColor *= alpha;
#endif

    if (fragColor.a < materialUniforms.alphaTest) {
        discard;
    }

#ifdef HAS_VERTEX_COLOR
    fragColor *= vertexColor_get();
#endif

#ifdef HAS_HEATMAP
    fragColor = heatmap_getColor(fragColor);
#endif
#if HAS_HIGHLIGHT_OPACITY || HAS_HIGHLIGHT_COLOR
    fragColor = highlight_blendColor(fragColor, vertexOutput);
#endif

#ifdef HAS_LAYER_OPACITY
    fragColor *= lightUniforms.layerOpacity;
#endif

#ifdef HAS_MASK_EXTENT
    fragColor = setMask(fragColor);
#endif
    return fragColor;
}
