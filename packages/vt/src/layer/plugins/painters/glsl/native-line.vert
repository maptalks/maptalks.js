#define SHADER_NAME NATIVE_LINE

#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

uniform mat4 projViewModelMatrix;
uniform mat4 positionMatrix;

#ifndef PICKING_MODE
    #if defined(HAS_COLOR)
        attribute vec4 aColor;
        varying vec4 vColor;
    #endif
#else
    #include <fbo_picking_vert>
#endif

#include <vt_position_vert>

void main() {
    vec3 position = unpackVTPosition();
    gl_Position = projViewModelMatrix * positionMatrix * vec4(position, 1.0);

    #ifndef PICKING_MODE
        #if defined(HAS_COLOR)
            vColor = aColor / 255.0;
        #endif
    #else
        fbo_picking_setData(gl_Position.w, true);
    #endif
}
