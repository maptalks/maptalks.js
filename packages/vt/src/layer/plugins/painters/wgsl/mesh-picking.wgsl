#include <fbo_picking_vert>
#include <get_output>

struct vertexInput {
    @location($i) aPosition: vec3f,
}

struct Uniforms {
    projViewModelMatrix: mat4x4f,
    modelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
}

@group(0) @binding($b) var<uniform> uniforms: Uniforms;

struct VertexOutput {
    @builtin(position) position: vec4f,
    // 其他varying变量可以在这里添加
}

fn getPositionMatrix() -> mat4x4f {
    return uniforms.positionMatrix;
}

fn getPosition(position: vec3f) -> vec4f {
    return vec4f(position, 1.0);
}

@vertex
fn main(input: vertexInput) -> VertexOutput {
    var output: VertexOutput;

    let localPositionMatrix = getPositionMatrix();
    let localPosition = getPosition(vec3f(input.aPosition.xyz), input);

    output.position = uniforms.projViewModelMatrix * localPositionMatrix * localPosition;
    // 传入Position的depth值
    fbo_picking_setData(input, &output, output.Position.w, true);

    return output;
}
