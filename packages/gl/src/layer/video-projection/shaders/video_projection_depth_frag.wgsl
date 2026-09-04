// 视频投影深度渲染片元着色器（WebGPU/WGSL 版本）
// 与 GLSL depth.frag 对应：把 NDC 深度编码到 RGBA，避免精度损失
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
    let fragCoordZ: f32 = 0.5 * vertexOutput.vHighPrecisionZW[0] / vertexOutput.vHighPrecisionZW[1] + 0.5;
    return packDepthToRGBA(fragCoordZ);
}
