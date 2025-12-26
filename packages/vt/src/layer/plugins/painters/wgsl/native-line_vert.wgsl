struct VertexInput {
#ifdef HAS_ALTITUDE
    @location($i) aPosition: vec2i,
    @location($i) aAltitude: f32,
#else
    @location($i) aPosition: vec4i,
#endif
#ifndef PICKING_MODE
    #if HAS_COLOR
        @location($i) aColor: vec4u,
    #endif
#endif
}

struct MyAppUniforms {
    projViewModelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
};

@group(0) @binding($b) var<uniform> uniforms: MyAppUniforms;

struct VertexOutput {
    @builtin(position) position: vec4f,
#ifndef PICKING_MODE
    #if HAS_COLOR
        @location($o) vColor: vec4f,
    #endif
#endif
}

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif

#include <vt_position_vert>

@vertex
fn main(
    vertexInput: VertexInput
) -> VertexOutput {
    var out: VertexOutput;

    let position = unpackVTPosition(vertexInput);
    out.position = uniforms.projViewModelMatrix * uniforms.positionMatrix * vec4f(position, 1.0);

    #ifndef PICKING_MODE
        #if HAS_COLOR
            out.vColor = vertexInputWithColor.aColor / 255.0;
        #endif
    #else
        fbo_picking_setData(vertexInput, &out, out.position.w, true);
    #endif

    return out;
}
