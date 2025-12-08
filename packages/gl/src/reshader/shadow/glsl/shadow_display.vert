#define SHADER_NAME SHADOW_DISPLAY

attribute vec3 aPosition;
uniform mat4 projViewModelMatrix;


#include <vsm_shadow_vert>

void main() {
    vec4 pos = vec4(aPosition, 1.);
    gl_Position = projViewModelMatrix * pos;

    shadow_computeShadowPars(pos);
}
