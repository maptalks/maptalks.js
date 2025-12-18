#include <rgbm_frag>

struct GaussianBlurUniforms {
    rgbmRange: f32,
    blurDir: vec2f,
    outSize: vec2f,
    pixelRatio: vec2f,
    outputSize: vec2f,
};

@group(0) @binding($b) var<uniform> uniforms: GaussianBlurUniforms;
@group(0) @binding($b) var TextureBlurInput: texture_2d<f32>;
@group(0) @binding($b) var TextureBlurInputSampler: sampler;

fn gaussianBlur(gTexCoord: vec2f) -> vec4f {
    var pixel = 0.196380615234375 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord), uniforms.rgbmRange), 1.0).rgb;

    var blurDirection = uniforms.pixelRatio.xy * uniforms.blurDir.xy / uniforms.outputSize.xy;
    blurDirection = blurDirection * uniforms.outSize.y * 0.00075;

    var offset = blurDirection * 1.411764705882353;

    pixel += 0.2967529296875 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord + offset), uniforms.rgbmRange), 1.0).rgb;
    pixel += 0.2967529296875 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord - offset), uniforms.rgbmRange), 1.0).rgb;

    offset = blurDirection * 3.2941176470588234;

    pixel += 0.09442138671875 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord + offset), uniforms.rgbmRange), 1.0).rgb;
    pixel += 0.09442138671875 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord - offset), uniforms.rgbmRange), 1.0).rgb;

    offset = blurDirection * 5.176470588235294;

    pixel += 0.0103759765625 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord + offset), uniforms.rgbmRange), 1.0).rgb;
    pixel += 0.0103759765625 * vec4f(decodeRGBM(textureSample(TextureBlurInput, TextureBlurInputSampler, gTexCoord - offset), uniforms.rgbmRange), 1.0).rgb;

    return vec4f(pixel, 1.0);
}

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let gTexCoord = vertexOutput.position.xy / uniforms.outputSize.xy;
    var color = gaussianBlur(gTexCoord);
    color = encodeRGBM(color.rgb, uniforms.rgbmRange);
    return color;
}
