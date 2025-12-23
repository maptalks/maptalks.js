const vert = /*wgsl*/`
#include <fbo_picking_vert>
#include <get_output>

struct VertexInput {
    #ifdef POSITION_IS_INT
        @location($i) aPosition: vec4i,
    #else
        @location($i) aPosition: vec3f,
    #endif
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

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    let localPositionMatrix = getPositionMatrix(input, &output, uniforms.positionMatrix);
    let localPosition = getPosition(vec3f(input.aPosition.xyz), input);

    output.position = uniforms.projViewModelMatrix * localPositionMatrix * localPosition;
    // 传入Position的depth值
    fbo_picking_setData(input, &output, output.position.w, true);

    return output;
}
`;

export default {
    vert
};
