#define HAS_HIGHLIGHT_COLOR_POINT 1

struct MarkerFragUniforms {
    alphaTest: f32,
    markerOpacity: f32
};

struct ShaderUniforms {

    layerOpacity: f32
}

@group(0) @binding($b) var<uniform> uniforms: MarkerFragUniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;
@group(0) @binding($b) var iconTex: texture_2d<f32>;
@group(0) @binding($b) var iconTexSampler: sampler;

#include <highlight_frag>

struct VertexOutput {
    @location($i) vTexCoord: vec2f,
    @location($i) vOpacity: f32,
    @location($i) vGammaScale: f32,
    @location($i) vTextSize: f32,
    @location($i) vHalo: f32,
    @location($i) vIsText: f32,
    #ifdef HAS_TEXT_FILL
        @location($i) vTextFill: vec4f,
    #endif
    #ifdef HAS_TEXT_HALO_FILL
        @location($i) vTextHaloFill: vec4f,
    #endif
    #if HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY
        @location($i) vTextHalo: vec2f,
    #endif
}

#include <text_render_frag>

@fragment
fn main(input: VertexOutput) -> @location(0) vec4f {
    var fragColor: vec4f;
    let isText = input.vIsText > 0.5;
    let textColor = renderText(input);
    let iconColor = textureSample(iconTex, iconTexSampler, input.vTexCoord) * uniforms.markerOpacity;
    // 如果条件写为 vIsText == 1.0 会因为精度问题导致判断错误
    if (isText) {
        fragColor = textColor;
    } else {
        fragColor = iconColor;
    }

    fragColor = fragColor * input.vOpacity * shaderUniforms.layerOpacity;

    // if (uniforms.blendSrcIsOne == 1.0) {
    //     fragColor *= fragColor.a;
    // }

    // float alphaSum = 0.0;
    // for (int x = -BOXBLUR_OFFSET; x <= BOXBLUR_OFFSET; ++x)
    // for (int y = -BOXBLUR_OFFSET; y <= BOXBLUR_OFFSET; ++y)
    // {
    //     vec2 uv = input.vTexCoord.st + vec2(float(x) / resolution.x, float(y) / resolution.y);
    //     uv = clamp(uv, 0.0, 1.0);
    //     vec4 fetchColor = textureSample(iconTex, iconTexSampler, uv);
    //     alphaSum += fetchColor.a;
    // }

    // if (alphaSum / 6.0 < 0.05) {
    //     discard;
    // }

    if (fragColor.a < 0.05) {
        discard;
    }

    var color: vec4f;
    color = fragColor;

    if (color.a < uniforms.alphaTest) {
        discard;
    }

    #if HAS_HIGHLIGHT_OPACITY || HAS_HIGHLIGHT_COLOR
        return highlight_blendColor(color, input);
    #else
        return color;
    #endif
    // output.color = vec4f(input.vIsText, 0.0, 0.0, 1.0);
}
