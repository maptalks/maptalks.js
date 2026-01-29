#include <get_output>

struct Uniforms {
    positionMatrix: mat4x4f,
    projViewModelMatrix: mat4x4f,
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;

struct VertexInput {
    #include <position_vert>
};

struct VertexOutput {
    @builtin(position) position: vec4f
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let localPositionMatrix: mat4x4f = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);
    let localPosition: vec4f = localPositionMatrix * getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);

    output.position = uniforms.projViewModelMatrix * localPosition;

    return output;
}
