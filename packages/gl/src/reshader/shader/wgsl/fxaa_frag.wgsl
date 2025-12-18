struct FxaaUniforms {
  enableFXAA: f32,
  enableToneMapping: f32,
  enableSharpen: f32,
  resolution: vec2f,
  pixelRatio: f32,
  sharpFactor: f32,
  #ifdef HAS_OUTLINE_TEX
  highlightFactor: f32,
  outlineFactor: f32,
  outlineWidth: f32,
  outlineColor: vec3f,
  #endif
};

@binding($b) @group(0) var<uniform> uniforms: FxaaUniforms;
#ifdef HAS_MULTISAMPLED
@binding($b) @group(0) var textureSource: texture_multisampled_2d<f32>;
#else
@binding($b) @group(0) var textureSource: texture_2d<f32>;
#endif
@binding($b) @group(0) var textureSourceSampler: sampler;


#ifdef HAS_OUTLINE_TEX
#ifdef HAS_MULTISAMPLED
@binding($b) @group(0) var textureOutline: texture_multisampled_2d<f32>;
#else
@binding($b) @group(0) var textureOutline: texture_2d<f32>;
#endif
@binding($b) @group(0) var textureOutlineSampler: sampler;
#endif

var<private> gTexCoord: vec2f;

fn fetchSourceTexel(uv: vec2f) -> vec4f {
  let flipUV = vec2f(uv.x, 1.0 - uv.y);
#ifdef HAS_MULTISAMPLED
  return textureLoad(textureSource, vec2i(flipUV * vec2f(uniforms.resolution)), 0);
#else
  return textureSample(textureSource, textureSourceSampler, flipUV);
#endif
}

#ifdef HAS_OUTLINE_TEX
  fn fetchOutlineTexel(uv: vec2f) -> vec4f {
    let flipUV = vec2f(uv.x, 1.0 - uv.y);
  #ifdef HAS_MULTISAMPLED
    return textureLoad(textureOutline, vec2i(flipUV * vec2f(uniforms.resolution)), 0);
  #else
    return textureSample(textureOutline, textureOutlineSampler, flipUV);
  #endif
  }
#endif

fn readFXAATexture(uv: vec2f) -> vec4f {
  // return textureSample(textureSource, textureSourceSampler, uv);
  return fetchSourceTexel(uv);
}

fn sharpColorFactor(color: vec3f, sharp: f32) -> vec3f {
    let off = uniforms.pixelRatio / uniforms.resolution;
    var count: f32 = 0.0;

    let rgbNW = fetchSourceTexel(gTexCoord + off * vec2f(-1.0, -1.0));
    let rgbNW_rgb = select(vec3f(0.0), rgbNW.rgb, rgbNW.a > 0.0);
    count += select(0.0, 1.0, rgbNW.a > 0.0);

    let rgbSE = fetchSourceTexel(gTexCoord + off * vec2f(1.0, 1.0));
    let rgbSE_rgb = select(vec3f(0.0), rgbSE.rgb, rgbSE.a > 0.0);
    count += select(0.0, 1.0, rgbSE.a > 0.0);

    let rgbNE = fetchSourceTexel(gTexCoord + off * vec2f(1.0, -1.0));
    let rgbNE_rgb = select(vec3f(0.0), rgbNE.rgb, rgbNE.a > 0.0);
    count += select(0.0, 1.0, rgbNE.a > 0.0);

    let rgbSW = fetchSourceTexel(gTexCoord + off * vec2f(-1.0, 1.0));
    let rgbSW_rgb = select(vec3f(0.0), rgbSW.rgb, rgbSW.a > 0.0);
    count += select(0.0, 1.0, rgbSW.a > 0.0);

    return color + sharp * (count * color - rgbNW_rgb - rgbNE_rgb - rgbSW_rgb - rgbSE_rgb);
}

fn sharpen(color: vec4f) -> vec4f {
    return vec4f(sharpColorFactor(color.rgb, uniforms.sharpFactor), color.a);
}

fn HDR_ACES(x: vec3f) -> vec3f {
    let a: f32 = 2.51;
    let b: f32 = 0.03;
    let c: f32 = 2.43;
    let d: f32 = 0.59;
    let e: f32 = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

fn tonemap(color: vec3f) -> vec3f {
    var result = color / (color + vec3f(1.0));
    result = pow(result, vec3f(1.0 / 2.2));
    return result;
}

#ifdef HAS_OUTLINE_TEX
fn outline() -> vec4f {
    let offsetx = uniforms.pixelRatio / uniforms.resolution.x * uniforms.outlineWidth;
    let offsety = uniforms.pixelRatio / uniforms.resolution.y * uniforms.outlineWidth;
    let fac0: f32 = 2.0;
    let fac1: f32 = 1.0;

    let texel0 = fetchOutlineTexel(gTexCoord + vec2f(offsetx, offsety));
    let texel1 = fetchOutlineTexel(gTexCoord + vec2f(offsetx, 0.0));
    let texel2 = fetchOutlineTexel(gTexCoord + vec2f(offsetx, -offsety));
    let texel3 = fetchOutlineTexel(gTexCoord + vec2f(0.0, -offsety));
    let texel4 = fetchOutlineTexel(gTexCoord + vec2f(-offsetx, -offsety));
    let texel5 = fetchOutlineTexel(gTexCoord + vec2f(-offsetx, 0.0));
    let texel6 = fetchOutlineTexel(gTexCoord + vec2f(-offsetx, offsety));
    let texel7 = fetchOutlineTexel(gTexCoord + vec2f(0.0, offsety));

    let rowx = -fac0 * texel5 + fac0 * texel1 + -fac1 * texel6 + fac1 * texel0 + -fac1 * texel4 + fac1 * texel2;
    let rowy = -fac0 * texel3 + fac0 * texel7 + -fac1 * texel4 + fac1 * texel6 + -fac1 * texel2 + fac1 * texel0;

    let magSqr = sqrt(dot(rowy, rowy) + dot(rowx, rowx));
    let infMag = magSqr < 1.0 / 65025.0;

    let texelCenter = fetchOutlineTexel(gTexCoord).r * uniforms.outlineColor;

    if (all(texelCenter == vec3f(0.0)) || (uniforms.highlightFactor == 0.0 && infMag)) {
        return vec4f(0.0);
    }

    let finalFactor = select(min(1.0, sqrt(magSqr) * uniforms.outlineFactor), uniforms.highlightFactor, infMag);
    return finalFactor * vec4f(texelCenter, 1.0);
}

fn composeOutline(color: vec4f) -> vec4f {
    let outlineColor = outline();
    return outlineColor + color * (1.0 - outlineColor.a);
}
#endif

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    gTexCoord = vertexOutput.vTexCoord;
    var color: vec4f;

    if (uniforms.enableFXAA == 1.0) {
        // FXAA implementation would go here
        color = readFXAATexture(vertexOutput.vTexCoord);
    } else {
        color = readFXAATexture(vertexOutput.vTexCoord);
    }

    if (uniforms.enableSharpen == 1.0) {
        color = sharpen(color);
    }

    if (uniforms.enableToneMapping == 1.0) {
        color = vec4(tonemap(color.rgb), color.a);
    }

    #ifdef HAS_OUTLINE_TEX
      color = composeOutline(color);
    #endif

    return color;
}
