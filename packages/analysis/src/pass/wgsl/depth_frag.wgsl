// Uniform 结构体
struct FragUniforms {
    logDepthBufFC: f32,
};

@group(0) @binding($b) var<uniform> uniforms: FragUniforms;

// 常量定义
const PackUpscale: f32 = 256.0 / 255.0;
const UnpackDownscale: f32 = 255.0 / 256.0;
const PackFactors: vec3f = vec3f(256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0);
const UnpackFactors: vec4f = vec4f(UnpackDownscale / PackFactors, UnpackDownscale);
const ShiftRight8: f32 = 1.0 / 256.0;

fn packDepthToRGBA(v: f32) -> vec4f {
    var r: vec4f = vec4f(fract(v * PackFactors), v);
    r = vec4f(r.x, r.yzw - r.xyz * ShiftRight8);
    return r * PackUpscale;
}

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    // 注意：WGSL 中没有 gl_FragDepthEXT 的直接等价物
    // 深度输出需要使用 @builtin(frag_depth) 属性
    // 这里假设深度计算仅用于其他目的，不直接设置片段深度

    let fragCoordZ: f32 = vertexOutput.vHighPrecisionZW[0] / vertexOutput.vHighPrecisionZW[1];
    var glFragColor: vec4f = packDepthToRGBA(fragCoordZ);

    return glFragColor;
}
