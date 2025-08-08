#define SHADER_NAME BILL_BOARD
#include <gl2_vert>

#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

attribute vec2 aExtrude;
attribute vec2 aTexCoord;
attribute vec4 aQuat;
varying vec2 vTexCoord;

uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;

uniform float extrudeScale;

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif

#include <vt_position_vert>

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif

mat4 quatToMat4(vec4 q) {
    float x = q.x, y = q.y, z = q.z, w = q.w;

    // 计算中间变量（优化计算）
    float x2 = x * x, y2 = y * y, z2 = z * z;
    float xy = x * y, xz = x * z, yz = y * z;
    float wx = w * x, wy = w * y, wz = w * z;

    // 构造旋转矩阵（列主序）
    return mat4(
        1.0 - 2.0 * (y2 + z2), 2.0 * (xy + wz), 2.0 * (xz - wy), 0.0,
        2.0 * (xy - wz), 1.0 - 2.0 * (x2 + z2), 2.0 * (yz + wx), 0.0,
        2.0 * (xz + wy), 2.0 * (yz - wx), 1.0 - 2.0 * (x2 + y2), 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

void main() {
    vec4 extrude = vec4(aExtrude.x * extrudeScale, 0.0, aExtrude.y, 1.0);
    mat4 rotationMat4 = quatToMat4(aQuat);
    vec3 offset = (rotationMat4 * extrude).xyz;
    vec3 position = unpackVTPosition(offset);

    vTexCoord = aTexCoord;

    gl_Position = projViewModelMatrix * positionMatrix * vec4(position, 1.0);

    #ifdef PICKING_MODE
        fbo_picking_setData(gl_Position.w, true);
    #elif defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        shadow_computeShadowPars(vec4(position, 1.0));
    #endif
}
