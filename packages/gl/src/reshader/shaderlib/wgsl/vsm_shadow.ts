const vert = /* wgsl */`
struct ShadowUniforms {
    shadow_lightProjViewModelMatrix: mat4x4f,
};

@group(0) @binding($b) var<uniform> shadowUniforms: ShadowUniforms;

struct VertexOutput {
    shadow_vLightSpacePos: vec4f,
};

fn shadow_computeShadowPars(position: vec4f, vertexOutput: VertexOutput) {
    vertexOutput.shadow_vLightSpacePos = shadowUniforms.shadow_lightProjViewModelMatrix * position;
}
`;

const frag = /* wgsl */`
struct ShadowUniforms {
    shadow_opacity: f32,
    shadow_color: vec3f,
    esm_shadow_threshold: f32
};

@group(0) @binding($b) var<uniform> shadowUniforms: ShadowUniforms;
@group(0) @binding($b) var shadow_shadowMapSampler: sampler;
@group(0) @binding($b) var shadow_shadowMap: texture_2d<f32>;


#ifdef PACK_FLOAT
#include <common_pack_float>
#endif

fn esm(projCoords: vec3f, shadowTexel: vec4f) -> f32 {
    let compare = projCoords.z;
    let c = 120.0;
#ifdef PACK_FLOAT
    let depth = common_decodeDepth(shadowTexel);
    if (depth >= 1.0 - 1E-6 || compare <= depth) {
        return 1.0;
    }
#else
    let depth = shadowTexel.r;
#endif

    let depth = exp(-c * min(compare - depth, 0.05));
    return clamp(depth, shadowUniforms.esm_shadow_threshold, 1.0);
}

fn shadow_computeShadow_coeff(shadowMap: texture_2d<f32>, projCoords: vec3f) -> f32 {
    let uv = projCoords.xy;
    let shadowTexel = textureSample(shadowMap, shadow_shadowMapSampler, uv);
    let esm_coeff = esm(projCoords, shadowTexel);
    let coeff = esm_coeff * esm_coeff;
    return 1.0 - (1.0 - coeff) * shadowUniforms.shadow_opacity;
}

fn shadow_computeShadow(vertexOutput: VertexOutput) -> f32 {
    let projCoords = vertexOutput.shadow_vLightSpacePos.xyz / vertexOutput.shadow_vLightSpacePos.w;
    projCoords = projCoords * 0.5 + 0.5;
    if (projCoords.z >= 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) {
        return 1.0;
    }
    return shadow_computeShadow_coeff(shadow_shadowMap, projCoords);
}

fn shadow_blend(color: vec3f, coeff: f32) -> vec3f {
    color = color * coeff + shadowUniforms.shadow_color * shadowUniforms.shadow_opacity * (1.0 - coeff);
    return color;
}
`;

const varyings = [
    {
        name: 'shadow_vLightSpacePos',
        type: 'vec4f',
        defines: ['HAS_SHADOWING']
    }
];

export default {
    defines: (defines) => {
        return defines['HAS_SHADOWING'] && !defines['HAS_BLOOM'];
    },
    vert, frag, varyings
}
