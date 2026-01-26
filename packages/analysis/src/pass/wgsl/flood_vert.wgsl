#include <get_output>

struct Uniforms {
    modelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
};

struct ShaderUniforms {
    projViewMatrix: mat4x4f
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;

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
    @builtin(position) position: vec4f,
    @location($o) vWorldPosition: vec4f,
    @location($o) flood_height: f32,
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let localPositionMatrix: mat4x4f = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);
    let localPosition: vec4f = localPositionMatrix * getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);
    let worldPosition = uniforms.modelMatrix * localPosition;

    output.position = shaderUniforms.projViewMatrix * worldPosition;
    output.vWorldPosition = worldPosition;
    output.flood_height = worldPosition.z;

    return output;
}
