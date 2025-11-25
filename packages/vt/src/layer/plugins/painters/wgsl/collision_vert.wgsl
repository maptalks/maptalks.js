struct Uniforms {
    size: vec2f,
};

@binding($b) @group(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
    @location($i) aPosition: vec2f,
    @location($i) aVisible: f32,
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) vColor: vec4f,
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var vertexOutput: VertexOutput;

    let uv = (vertexInput.aPosition / uniforms.size - 0.5) * 2.0 * vec2f(1.0, -1.0);
    vertexOutput.position = vec4f(uv, 0.0, 1.0);

    vertexOutput.vColor = mix(
        vec4f(1.0, 0.0, 0.0, 1.5) * 0.5,
        vec4f(0.0, 1.0, 0.0, 1.0) * 0.4,
        vertexInput.aVisible
    );

    return vertexOutput;
}
