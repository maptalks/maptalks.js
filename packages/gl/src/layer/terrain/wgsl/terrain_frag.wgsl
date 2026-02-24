#define SHADER_NAME TERRAIN_MESH

#include <mask_frag>
#if HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_frag>
#endif

struct TerrainUniforms {
    polygonOpacity: f32,
};

@group(0) @binding($b) var<uniform> uniforms: TerrainUniforms;
@group(0) @binding($b) var skin: texture_2d<f32>;
@group(0) @binding($b) var skinSampler: sampler;

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    var uv = vec2f(vertexOutput.vUv);
    // uv.y = 1.0 - uv.y;
    var color = textureSample(skin, skinSampler, uv);

    #if HAS_SHADOWING && !HAS_BLOOM
        var shadowCoeff = shadow_computeShadow(vertexOutput);
        color.rgb = shadow_blend(color.rgb, shadowCoeff).rgb;
    #endif

    var fragColor = color * uniforms.polygonOpacity;

    #ifdef HAS_MASK_EXTENT
        fragColor = setMask(fragColor);
    #endif

    return fragColor;
}
