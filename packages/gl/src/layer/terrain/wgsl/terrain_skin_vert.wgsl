struct VertexInput {
    @location($i) aPosition: vec2i
};

struct VertexOutput {
    @builtin(position) position : vec4f,
}

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var vertexOutput: VertexOutput;
    vertexOutput.position = vec4f(vec2f(vertexInput.aPosition), 0.0, 1.0);
    return vertexOutput;
}
