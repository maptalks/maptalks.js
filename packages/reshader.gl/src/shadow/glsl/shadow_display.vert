attribute vec3 aPosition;

uniform mat4 projViewModelMatrix;

varying vec4 vPosition;

#include <vsm_shadow_vert>

void main() {
    vec4 pos = vec4(aPosition, 1.);

    gl_Position = projViewModelMatrix * pos;
    vPosition = gl_Position;

    shadow_computeShadowPars(pos);
}
