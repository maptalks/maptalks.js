#define SHADER_NAME NATIVE_POINT
#include <gl2_vert>

attribute vec3 aPosition;
#ifdef HAS_COLOR
attribute vec4 aColor;
varying vec4 vColor;
#endif


uniform mat4 projViewModelMatrix;
uniform float markerSize;

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    gl_PointSize = markerSize;

    #ifdef HAS_COLOR
    vColor = aColor / 255.0;
    vColor = vec4(1.0, 0.0, 0.0, 1.0);
    #endif

    #ifdef PICKING_MODE
        fbo_picking_setData(gl_Position.w, true);
    #endif
}
