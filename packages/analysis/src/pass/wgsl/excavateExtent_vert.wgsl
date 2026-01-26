#include <get_output>

struct Uniforms {
    positionMatrix: mat4x4f,
    projViewModelMatrix: mat4x4f,
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;

struct VertexInput {
    #if HAS_DRACO_POSITION || HAS_COMPRESSED_INT16_POSITION
        @location($i) aPosition: vec4i,
    #else
        #ifdef POSITION_IS_INT
            @location($i) aPosition: vec4i,
        #else
            @location($i) aPosition: vec3f,
        #endif
    #endif
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
