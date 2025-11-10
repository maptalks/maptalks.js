struct VertexInput {
#ifdef HAS_ALTITUDE
        @location($i) aPosition: POSITION_TYPE_2,
        @location($i) aAltitude: f32,
#else
        @location($i) aPosition: POSITION_TYPE_3,
#endif
}

struct UniformsStruct {
    projViewModelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
}

@group(0) @binding($b) var<uniform> uniforms: UniformsStruct;

struct VertexOutput {
    @builtin(position) position: vec4f,
}

#include <fbo_picking_vert>
#include <vt_position_vert>

@vertex
fn main(
    input: VertexInput,
) -> VertexOutput {
    let position = unpackVTPosition(input);
    var output: VertexOutput;
    output.position = uniforms.projViewModelMatrix * uniforms.positionMatrix * vec4f(position, 1.0);

    fbo_picking_setData(input, &output, output.position.w, true);
    return output;
}
