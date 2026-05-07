#define SHADER_NAME TERRAIN_MESH

#include <mask_frag>
#if HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_frag>
#endif

struct LayerUniforms {
    layerOpacity: f32,
    #if HAS_COLORS
        colorsMin: f32,
        colorsMax: f32,
    #endif
};

@group(0) @binding($b) var<uniform> layerUniforms: LayerUniforms;

#if HAS_COLORS
    @group(0) @binding($b) var colorsTexture: texture_2d<f32>;
    @group(0) @binding($b) var colorsTextureSampler: sampler;

    fn getColor(vAltitude: f32) -> vec4f {
        var altitude = clamp(vAltitude, layerUniforms.colorsMin, layerUniforms.colorsMax);
        var altitudeNorm = (altitude - layerUniforms.colorsMin) / (layerUniforms.colorsMax - layerUniforms.colorsMin);
        var colorFromTexture = textureSample(colorsTexture, colorsTextureSampler, vec2f(altitudeNorm, 0.5));
        return colorFromTexture;
    }

#else
    @group(0) @binding($b) var skin: texture_2d<f32>;
    @group(0) @binding($b) var skinSampler: sampler;
#endif

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    var uv = vec2f(vertexOutput.vUv);
    // uv.y = 1.0 - uv.y;

    #if HAS_COLORS
        var colorFromTexture = getColor(vertexOutput.vAltitude);
        var color = colorFromTexture;
    #else
        var color = textureSample(skin, skinSampler, uv);
    #endif

    #if HAS_SHADOWING && !HAS_BLOOM
        var shadowCoeff = shadow_computeShadow(vertexOutput);
        color = vec4f(shadow_blend(color.rgb, shadowCoeff).rgb, color.a);
    #endif


    var fragColor = color * layerUniforms.layerOpacity;

    #ifdef HAS_MASK_EXTENT
        fragColor = setMask(fragColor);
    #endif

    return fragColor;
}
