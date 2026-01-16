struct AttributeInput {
    @location($i) aPosition: vec2i,
#ifdef HAS_ALTITUDE
    @location($i) instancePosition: vec2i,
    @location($i) instanceAltitude: f32,
#else
    @location($i) instancePosition: vec4i,
#endif
#ifndef PICKING_MODE
    #ifdef HAS_COLOR
        @location($i) aColor: vec4u,
    #endif
#endif
};

struct VertexInput {
#ifdef HAS_ALTITUDE
    aPosition: vec2i,
    aAltitude: f32,
#else
    aPosition: vec4i,
#endif
    aPickingId: f32,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    #ifndef PICKING_MODE
        #ifdef HAS_COLOR
            @location($o) vColor: vec4f,
        #endif
    #endif
};

struct MarkerUniforms {
    positionMatrix: mat4x4f,
    projViewModelMatrix: mat4x4f,
    markerSize: f32,
};

@group(0) @binding($b) var<uniform> uniforms: MarkerUniforms;
@group(0) @binding($b) var<uniform> resolution: vec2f;

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif

#include <vt_position_vert>

@vertex
fn main(
    input: AttributeInput
) -> VertexOutput {
    var out: VertexOutput;

    var inputVertex: VertexInput;
    inputVertex.aPosition = input.instancePosition;

    #ifdef HAS_ALTITUDE
        inputVertex.aAltitude = input.instanceAltitude;
    #endif
    let position = unpackVTPosition(inputVertex);
    out.position = uniforms.projViewModelMatrix * uniforms.positionMatrix * vec4f(position, 1.0);
    let markerSize = uniforms.markerSize / resolution;
    let w = out.position.w;
    out.position.x += f32(input.aPosition.x) * markerSize.x * w;
    out.position.y += f32(input.aPosition.y) * markerSize.y * w;
    #ifndef PICKING_MODE
        #ifdef HAS_COLOR
            out.vColor = vec4f(input.aColor) / 255.0;
        #endif
    #endif

    #ifdef PICKING_MODE
        inputVertex.aPickingId = input.aPickingId;
        fbo_picking_setData(inputVertex, &out, w, true);
    #endif

    return out;
}
