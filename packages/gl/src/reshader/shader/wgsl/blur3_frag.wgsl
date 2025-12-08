struct GaussianBlurUniforms {
    rgbmRange: f32,
    blurDir: vec2f,
    pixelRatio: vec2f,
    outputSize: vec2f,
};

@group(0) @binding($b) var<uniform> uniforms: GaussianBlurUniforms;
@group(0) @binding($b) var TextureBlurInput: texture_2d<f32>;
@group(0) @binding($b) var TextureBlurInputSampler: sampler;

struct VertexOutput {
    @builtin(position) position: vec4f,
};

#include <rgbm_frag>

fn gaussianBlur(gTexCoord: vec2f) -> vec4f {
    var pixel = 0.24609375 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord), uniforms.rgbmRange), 1.0).rgb;

    let blurDirection = uniforms.pixelRatio.xy * uniforms.blurDir.xy / uniforms.outputSize.xy;
    var offset = blurDirection * 1.3636363636363635;

    pixel += 0.322265625 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord + offset), uniforms.rgbmRange), 1.0).rgb;
    pixel += 0.322265625 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord - offset), uniforms.rgbmRange), 1.0).rgb;

    offset = blurDirection * 3.1818181818181817;

    pixel += 0.0537109375 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord + offset), uniforms.rgbmRange), 1.0).rgb;
    pixel += 0.0537109375 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord - offset), uniforms.rgbmRange), 1.0).rgb;

    return vec4f(pixel, 1.0);
}

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let gTexCoord = vertexOutput.position.xy / uniforms.outputSize.xy;
    var color = gaussianBlur(gTexCoord);
    color = encodeRGBM(color.rgb, uniforms.rgbmRange);
    return color;
}
