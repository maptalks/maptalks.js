#include <get_output>

// Uniform 结构体
struct Uniforms {
    modelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
    projViewModelMatrix: mat4x4f,
    viewshed_projViewMatrixFromViewpoint: mat4x4f,
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;

// 顶点输入结构体
struct VertexInput {
    @location($i) aPosition: vec3f,
};

// 顶点输出结构体
struct VertexOutput {
    @builtin(position) position: vec4f,
    @builtin(point_size) point_size: f32,
    @location($o) viewshed_positionFromViewpoint: vec4f,
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    let localPositionMatrix: mat4x4f = getPositionMatrix(uniforms);
    let localPosition: vec4f = localPositionMatrix * getPosition(vertexInput.aPosition);

    var output: VertexOutput;
    output.viewshed_positionFromViewpoint = uniforms.viewshed_projViewMatrixFromViewpoint * uniforms.modelMatrix * localPosition;
    output.point_size = 1.0;
    output.position = uniforms.projViewModelMatrix * localPosition;

    return output;
}
