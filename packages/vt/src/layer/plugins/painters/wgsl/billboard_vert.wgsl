#ifdef HAS_ALTITUDE
    struct VertexInput {
        @location($i) aPosition: vec2i,
        @location($i) aAltitude: f32,

#else
    struct VertexInput {
        @location($i) aPosition: vec4i,

#endif
        @location($i) aExtrude: vec2i,
        @location($i) aTexCoord: vec2i,
        @location($i) aQuat: vec4f,
    };

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) vTexCoord: vec2f,
};

struct BillboardUniforms {
    positionMatrix: mat4x4f,
    projViewModelMatrix: mat4x4f,
    extrudeScale: f32,
};

@group(0) @binding($b) var<uniform> uniforms: BillboardUniforms;

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif

#include <vt_position_vert>

#if HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_vert>
#endif

fn quatToMat4(q: vec4f) -> mat4x4f {
    let x = q.x;
    let y = q.y;
    let z = q.z;
    let w = q.w;

    // 计算中间变量（优化计算）
    let x2 = x * x;
    let y2 = y * y;
    let z2 = z * z;
    let xy = x * y;
    let xz = x * z;
    let yz = y * z;
    let wx = w * x;
    let wy = w * y;
    let wz = w * z;

    // 构造旋转矩阵（列主序）
    return mat4x4f(
        1.0 - 2.0 * (y2 + z2), 2.0 * (xy - wz), 2.0 * (xz + wy), 0.0,
        2.0 * (xy + wz), 1.0 - 2.0 * (x2 + z2), 2.0 * (yz - wx), 0.0,
        2.0 * (xz - wy), 2.0 * (yz + wx), 1.0 - 2.0 * (x2 + y2), 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

@vertex
fn main(
    input: VertexInput
) -> VertexOutput {
    var output: VertexOutput;

    let extrude = vec4f(f32(input.aExtrude.x) * uniforms.extrudeScale, 0.0, f32(input.aExtrude.y), 1.0);
    let rotationMat4 = quatToMat4(input.aQuat);
    let offset = (rotationMat4 * extrude).xyz;

    let position = unpackVTPositionOffset(input, offset);

    output.vTexCoord = vec2f(input.aTexCoord);

    output.position = uniforms.projViewModelMatrix * uniforms.positionMatrix * vec4f(position, 1.0);

    #ifdef PICKING_MODE
        fbo_picking_setData(output.position.w, true);
    #elif HAS_SHADOWING && !HAS_BLOOM
        shadow_computeShadowPars(vec4f(position, 1.0), &output);
    #endif

    return output;
}
