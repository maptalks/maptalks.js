#include <line_extrusion_vert>
#include <get_output>

// Uniform 结构体定义
struct ShadowMappingUniforms {
    lightProjViewModelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
    modelMatrix: mat4x4f,
};

// Vertex 输入结构体
struct VertexInput {
    #include <position_vert>
};

// Vertex 输出结构体
struct VertexOutput {
    @builtin(position) position: vec4f
};

@group(0) @binding($b) var<uniform> uniforms: ShadowMappingUniforms;

@vertex
fn main(
    vertexInput: VertexInput
) -> VertexOutput {
    var output: VertexOutput;

    let localPositionMatrix = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);

    #ifdef IS_LINE_EXTRUSION
        let linePosition = getLineExtrudePosition(vec3f(vertexInput.aPosition.xyz), vertexInput);
        let localVertex = getPosition(linePosition, vertexInput);
    #else
        let localVertex = getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);
    #endif

    output.position = uniforms.lightProjViewModelMatrix * localPositionMatrix * localVertex;

    return output;
}
