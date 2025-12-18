struct SharpenUniforms {
    size: vec2f,
    enableSharpen: f32,
    sharpFactor: f32,
    pixelRatio: f32,
};

@group(0) @binding($b) var<uniform> uniforms: SharpenUniforms;
#ifdef HAS_MULTISAMPLED
@binding($b) @group(0) var texture: texture_multisampled_2d<f32>;
#else
@binding($b) @group(0) var texture: texture_2d<f32>;
#endif
@group(0) @binding($b) var textureSampler: sampler;

var<private> gTexCoord: vec2f;

fn fetchSourceTexel(uv: vec2f) -> vec4f {
#ifdef HAS_MULTISAMPLED
  return textureLoad(texture, vec2i(uv * vec2f(uniforms.size)), 0);
#else
  return textureSample(texture, textureSampler, uv);
#endif
}

fn sharpColorFactor(color: vec3f, sharp: f32) -> vec3f {
    let off = uniforms.pixelRatio / uniforms.size;
    var count: f32 = 0.0;

    var rgbNW = fetchSourceTexel(gTexCoord + off * vec2f(-1.0, -1.0));
    rgbNW = vec4f(select(vec3f(0.0), rgbNW.rgb, rgbNW.a > 0.0), rgbNW.a);
    count += select(0.0, 1.0, rgbNW.a > 0.0);

    var rgbSE = fetchSourceTexel(gTexCoord + off * vec2f(1.0, 1.0));
    rgbSE = vec4f(select(vec3f(0.0), rgbSE.rgb, rgbSE.a > 0.0), rgbSE.a);
    count += select(0.0, 1.0, rgbSE.a > 0.0);

    var rgbNE = fetchSourceTexel(gTexCoord + off * vec2f(1.0, -1.0));
    rgbNE = vec4f(select(vec3f(0.0), rgbNE.rgb, rgbNE.a > 0.0), rgbNE.a);
    count += select(0.0, 1.0, rgbNE.a > 0.0);

    var rgbSW = fetchSourceTexel(gTexCoord + off * vec2f(-1.0, 1.0));
    rgbSW = vec4f(select(vec3f(0.0), rgbSW.rgb, rgbSW.a > 0.0), rgbSW.a);
    count += select(0.0, 1.0, rgbSW.a > 0.0);

    return color + sharp * (count * color - rgbNW.rgb - rgbNE.rgb - rgbSW.rgb - rgbSE.rgb);
}

@fragment
fn main(
    input : VertexOutput,
) -> @location(0) vec4f {
    gTexCoord = input.position.xy / uniforms.size;
    var color = fetchSourceTexel(gTexCoord);

    if (uniforms.enableSharpen == 1.0) {
        color = vec4f(sharpColorFactor(color.rgb, uniforms.sharpFactor), color.a);
    }

    return color;
}
