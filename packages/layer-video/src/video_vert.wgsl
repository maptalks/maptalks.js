#include <get_output>

// Uniform 结构体
struct Uniforms {
    modelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
    projViewModelMatrix: mat4x4f,
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;

struct VertexInput {
    @location($i) aPosition: vec3f,
    @location($i) aTexCoord: vec2f,
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) vTexCoords: vec2f,
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let localPositionMatrix: mat4x4f = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);
    let localPosition: vec4f = getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);

    output.vTexCoords = vertexInput.aTexCoord;
    output.position = uniforms.projViewModelMatrix * localPositionMatrix * localPosition;

    return output;
}
