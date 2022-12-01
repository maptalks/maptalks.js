#define SHADER_NAME NATIVE_POINT
#include <gl2_vert>

#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
uniform float markerSize;

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif

#include <vt_position_vert>

void main() {
    vec3 position = unpackVTPosition();
    gl_Position = projViewModelMatrix * positionMatrix * vec4(position, 1.0);
    gl_PointSize = markerSize;

    #ifdef PICKING_MODE
        fbo_picking_setData(gl_Position.w, true);
    #endif
}
