// 投影视锥体线框片元着色器（WebGPU/WGSL 版本）
struct FrustumColorUniforms {
    uColor: vec4f,
};
@group(0) @binding($b) var<uniform> uniforms: FrustumColorUniforms;

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    return uniforms.uColor;
}
