#include <get_output>

// Uniform 结构体
struct Uniforms {
    modelMatrix: mat4x4f,
    modelViewMatrix: mat4x4f,
    positionMatrix: mat4x4f
};

struct ShaderUniforms {
    projMatrix: mat4x4f,
}

@group(0) @binding($b) var<uniform> uniforms: Uniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;

struct VertexInput {
    #include <position_vert>

    @location($i) aTexCoord: vec2f
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) vWorldPosition: vec4f,
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let localPositionMatrix: mat4x4f = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);
    let localPosition: vec4f = localPositionMatrix * getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);

    output.position = shaderUniforms.projMatrix * uniforms.modelViewMatrix * localPosition;
    let worldPosition = uniforms.modelMatrix * localPosition;
    output.vWorldPosition = worldPosition;

    return output;
}
