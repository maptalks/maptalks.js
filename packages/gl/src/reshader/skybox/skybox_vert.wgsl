struct Uniforms {
    projMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    transformMatrix: mat3x3f,
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;

struct VertexInput {
    @location($i) aPosition: vec3f,
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) vWorldPos: vec3f,
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    output.vWorldPos = vertexInput.aPosition;

    // remove translation from the view matrix
    let viewMatrix = uniforms.viewMatrix;
    let m3 = mat3x3f(viewMatrix[0].xyz, viewMatrix[1].xyz, viewMatrix[2].xyz) * uniforms.transformMatrix;
    let rotViewMatrix: mat4x4f = mat4x4f(
        vec4<f32>(m3[0], 0.0),
        vec4<f32>(m3[1], 0.0),
        vec4<f32>(m3[2], 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0)
    );
    let clipPos: vec4f = uniforms.projMatrix * rotViewMatrix * vec4f(output.vWorldPos, 1.0);

    output.position = vec4f(clipPos.xy, clipPos.w, clipPos.w);

    return output;
}
