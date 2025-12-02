struct GaussianBlur0Uniforms {
    rgbmRange: f32,
    blurDir: vec2f,
    pixelRatio: vec2f,
    outputSize: vec2f,
    outSize: vec2f,
    inputRGBM: f32,
    luminThreshold: f32,
};

@group(0) @binding($b) var<uniform> uniforms: GaussianBlur0Uniforms;
#ifdef HAS_MULTISAMPLED
@binding($b) @group(0) var TextureBlurInput: texture_multisampled_2d<f32>;
#else
@binding($b) @group(0) var TextureBlurInput: texture_2d<f32>;
#endif
@group(0) @binding($b) var TextureBlurInputSampler: sampler;

struct VertexOutput {
    @builtin(position) position: vec4f,
};

const colorBright = vec3f(0.2126, 0.7152, 0.0722);

fn getLuminance(color: vec3f) -> f32 {
    return dot(color, colorBright);
}

fn extractBright(color: vec4f) -> vec4f {
    let f = max(sign(getLuminance(color.rgb) - uniforms.luminThreshold), 0.0);
    return color * f;
}

fn encodeRGBM(color: vec3f, range: f32) -> vec4f {
    var rgbm: vec4f;
    let col = color / range;
    rgbm.a = clamp(max(max(col.r, col.g), max(col.b, 1e-6)), 0.0, 1.0);
    rgbm.a = ceil(rgbm.a * 255.0) / 255.0;
    rgbm = vec4f(col / rgbm.a, rgbm.a);
    return rgbm;
}

fn decodeRGBM(color: vec4f, range: f32) -> vec3f {
    if uniforms.inputRGBM == 0.0 {
        return color.rgb;
    }
    return range * color.rgb * color.a;
}

fn fetchSourceTexel(uv: vec2f) -> vec4f {
#ifdef HAS_MULTISAMPLED
  return textureLoad(TextureBlurInput, vec2i(uv * vec2f(uniforms.outSize)), 0);
#else
  return textureSample(TextureBlurInput, TextureBlurInputSampler, uv);
#endif
}

fn gaussianBlur(gTexCoord: vec2f) -> vec4f {
    var pixel = 0.375 * extractBright(vec4f(decodeRGBM(fetchSourceTexel(gTexCoord), uniforms.rgbmRange), 1.0)).rgb;

    let blurDirection = uniforms.pixelRatio.xy * uniforms.blurDir.xy / uniforms.outputSize.xy;
    let offset = blurDirection * 1.2;

    pixel += 0.3125 * extractBright(vec4f(decodeRGBM(fetchSourceTexel(gTexCoord + offset), uniforms.rgbmRange), 1.0)).rgb;
    pixel += 0.3125 * extractBright(vec4f(decodeRGBM(fetchSourceTexel(gTexCoord - offset), uniforms.rgbmRange), 1.0)).rgb;

    return vec4f(pixel, 1.0);
}


@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let gTexCoord = vertexOutput.position.xy / uniforms.outputSize.xy;
    var color = gaussianBlur(gTexCoord);
    color = encodeRGBM(color.rgb, uniforms.rgbmRange);
    return color;
}
