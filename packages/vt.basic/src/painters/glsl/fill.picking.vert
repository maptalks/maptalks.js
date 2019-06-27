#ifdef IS_2D_POSITION
    attribute vec2 aPosition;
#else
    attribute vec3 aPosition;
#endif

uniform mat4 projViewModelMatrix;

#include <fbo_picking_vert>

void main() {
    #ifdef IS_2D_POSITION
        vec3 position = vec3(aPosition, 0.0);
    #else
        vec3 position = aPosition;
    #endif
    gl_Position = projViewModelMatrix * vec4(position, 1);

    fbo_picking_setData(gl_Position.w, true);
}
