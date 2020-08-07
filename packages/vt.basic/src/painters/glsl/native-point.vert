#define SHADER_NAME NATIVE_POINT
#include <gl2_vert>

attribute vec3 aPosition;

uniform mat4 projViewModelMatrix;
uniform float markerSize;

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    gl_PointSize = markerSize;

    #ifdef PICKING_MODE
        fbo_picking_setData(gl_Position.w, true);
    #endif
}
