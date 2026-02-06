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
    @location($o) vAltitude: f32,
}

#include <vt_position_vert>

@vertex
fn main(
    input: VertexInput,
) -> VertexOutput {
    let position = unpackVTPosition(input);
    var output: VertexOutput;
    var localVertex = uniforms.positionMatrix * vec4f(position, 1.0);
    output.vAltitude = localVertex.z / 100;
    localVertex.z = 0;
    output.position = uniforms.projViewModelMatrix * localVertex;
    return output;
}
