// #define FXAA_REDUCE_MIN   (1.0/ 128.0)
// #define FXAA_REDUCE_MUL   (1.0 / 8.0)
// #define FXAA_SPAN_MAX     8.0

struct BloomCombineUniforms {
    bloomFactor: f32,
    bloomRadius: f32,
    rgbmRange: f32,
    enableAA: f32,
    outputSize: vec2f,
};

@group(0) @binding($b) var<uniform> uniforms: BloomCombineUniforms;
@group(0) @binding($b) var TextureBloomBlur1: texture_2d<f32>;
@group(0) @binding($b) var TextureBloomBlur1Sampler: sampler;
@group(0) @binding($b) var TextureBloomBlur2: texture_2d<f32>;
@group(0) @binding($b) var TextureBloomBlur2Sampler: sampler;
@group(0) @binding($b) var TextureBloomBlur3: texture_2d<f32>;
@group(0) @binding($b) var TextureBloomBlur3Sampler: sampler;
@group(0) @binding($b) var TextureBloomBlur4: texture_2d<f32>;
@group(0) @binding($b) var TextureBloomBlur4Sampler: sampler;
@group(0) @binding($b) var TextureBloomBlur5: texture_2d<f32>;
@group(0) @binding($b) var TextureBloomBlur5Sampler: sampler;
#ifdef HAS_MULTISAMPLED
@group(0) @binding($b) var TextureInput: texture_multisampled_2d<f32>;
@group(0) @binding($b) var TextureSource: texture_multisampled_2d<f32>;
#else
@group(0) @binding($b) var TextureInput: texture_2d<f32>;
@group(0) @binding($b) var TextureSource: texture_2d<f32>;
#endif
@group(0) @binding($b) var TextureInputSampler: sampler;
@group(0) @binding($b) var TextureSourceSampler: sampler;

var<private> gTexCoord: vec2f;

#include <srgb_frag>

fn decodeRGBM(color: vec4f, range: f32) -> vec3f {
    if (range <= 0.0) {
        return color.rgb;
    }
    return range * color.rgb * color.a;
}

fn getRadiusFactored(value: f32, middle: f32) -> f32 {
    return mix(value, middle * 2.0 - value, uniforms.bloomRadius);
}

fn fetchSourceTexel(uv: vec2f) -> vec4f {
#ifdef HAS_MULTISAMPLED
  return textureLoad(TextureSource, vec2i(uv * vec2f(uniforms.outputSize)), 0);
#else
  return textureSample(TextureSource, TextureSourceSampler, uv);
#endif
}

fn fetchInputTexel(uv: vec2f) -> vec4f {
#ifdef HAS_MULTISAMPLED
  return textureLoad(TextureInput, vec2i(uv * vec2f(uniforms.outputSize)), 0);
#else
  return textureSample(TextureInput, TextureInputSampler, uv);
#endif
}


fn bloomCombine() -> vec4f {
    var bloom: vec3f = vec3f(0.0);
    let midVal: f32 = 0.6;
    let factor1: f32 = 1.1;
    let factor2: f32 = 0.9;
    let factor3: f32 = 0.6;
    let factor4: f32 = 0.3;
    let factor5: f32 = 0.1;

    bloom += (vec4f(decodeRGBM(textureSample(TextureBloomBlur1, TextureBloomBlur1Sampler, gTexCoord), uniforms.rgbmRange), 1.0)).rgb * getRadiusFactored(factor1, midVal);
    bloom += (vec4f(decodeRGBM(textureSample(TextureBloomBlur2, TextureBloomBlur2Sampler, gTexCoord), uniforms.rgbmRange), 1.0)).rgb * getRadiusFactored(factor2, midVal);
    bloom += (vec4f(decodeRGBM(textureSample(TextureBloomBlur3, TextureBloomBlur3Sampler, gTexCoord), uniforms.rgbmRange), 1.0)).rgb * getRadiusFactored(factor3, midVal);
    bloom += (vec4f(decodeRGBM(textureSample(TextureBloomBlur4, TextureBloomBlur4Sampler, gTexCoord), uniforms.rgbmRange), 1.0)).rgb * getRadiusFactored(factor4, midVal);
    bloom += (vec4f(decodeRGBM(textureSample(TextureBloomBlur5, TextureBloomBlur5Sampler, gTexCoord), uniforms.rgbmRange), 1.0)).rgb * getRadiusFactored(factor5, midVal);

    var bloomInputColor: vec4f;
    if (uniforms.enableAA == 1.0) {
        // TextureInput是bloom本体
        // bloomInputColor = applyFXAA(TextureInput, gl_FragCoord.xy);
    } else {
        bloomInputColor = fetchInputTexel(gTexCoord);
    }
    bloomInputColor = vec4f(mix(vec3f(0.0), bloomInputColor.rgb, sign(bloomInputColor.a)), bloomInputColor.a);

    let srcColor = fetchSourceTexel(gTexCoord);

    let bloomAlpha: f32 = sqrt((bloom.r + bloom.g + bloom.b) / 3.0);
    let bloomColor: vec4f = vec4f(linearTosRGB(bloom * uniforms.bloomFactor), bloomAlpha);

    // srcColor 必须乘以 (1.0 - bloomInputColor.a)，否则会引起 fuzhenn/maptalks-studio#2571 中的bug
    return bloomInputColor + srcColor * (1.0 - bloomInputColor.a) + bloomColor;
}

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    // 假设vertexOutput包含position或其他必要属性
    // 这里需要根据实际的vertexOutput结构来访问gl_FragCoord的等价物
    // 假设vertexOutput.position是裁剪空间坐标，需要转换为屏幕坐标
    let fragCoord = vec2f(vertexOutput.position.xy);
    gTexCoord = fragCoord / uniforms.outputSize;

    let color = bloomCombine();
    // color.rgb = linearTosRGB(color.rgb);
    return color;
}
