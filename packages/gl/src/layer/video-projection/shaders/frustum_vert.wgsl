// 投影视锥体线框顶点着色器（WebGPU/WGSL 版本）
// 通过 aNext/aSide 在 clip 空间展开线段，支持任意线宽
struct FrustumMeshUniforms {
    projViewModelMatrix: mat4x4f,
};
@group(0) @binding($b) var<uniform> meshUniforms: FrustumMeshUniforms;

struct FrustumGlobalUniforms {
    uLineWidth: f32,
    uViewportHeight: f32,
};
@group(0) @binding($b) var<uniform> globalUniforms: FrustumGlobalUniforms;

struct VertexInput {
    @location($i) aPosition: vec3f,
    @location($i) aNext: vec3f,
    @location($i) aSide: f32,
};

struct VertexOutput {
    @builtin(position) position: vec4f,
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let clip0: vec4f = meshUniforms.projViewModelMatrix * vec4f(vertexInput.aPosition, 1.0);
    let clip1: vec4f = meshUniforms.projViewModelMatrix * vec4f(vertexInput.aNext, 1.0);
    let ndc0: vec2f = clip0.xy / clip0.w;
    let ndc1: vec2f = clip1.xy / clip1.w;
    let dir: vec2f = ndc1 - ndc0;
    let len: f32 = length(dir);
    // 屏幕空间垂直线段方向的法线
    let normal: vec2f = select(vec2f(1.0, 0.0), vec2f(-dir.y, dir.x) / len, len > 0.000001);
    // 线宽像素数 -> NDC 偏移（以画布高度为基准），再乘 clip0.w 转回 clip 空间
    let ndcOffset: f32 = globalUniforms.uLineWidth * 0.5 * (2.0 / globalUniforms.uViewportHeight);
    let clipOffset: vec2f = normal * vertexInput.aSide * ndcOffset * clip0.w;
    output.position = vec4f(clip0.xy + clipOffset, clip0.zw);
    return output;
}
