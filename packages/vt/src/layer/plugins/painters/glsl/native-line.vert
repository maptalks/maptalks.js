#define SHADER_NAME NATIVE_LINE
attribute vec3 aPosition;
uniform mat4 projViewModelMatrix;

#ifndef PICKING_MODE
    #if defined(HAS_COLOR)
        attribute vec4 aColor;
        varying vec4 vColor;
    #endif
#else
    #include <fbo_picking_vert>
#endif

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);

    #ifndef PICKING_MODE
        #if defined(HAS_COLOR)
            vColor = aColor / 255.0;
        #endif
    #else
        fbo_picking_setData(gl_Position.w, true);
    #endif
}
