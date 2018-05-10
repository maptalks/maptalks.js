attribute vec3 aPosition;

uniform mat4 model;
uniform mat4 projectionViewModel;

varying vec4 vPosition;

#include <vsm_shadow_vert>

void main() {
    vec4 pos = vec4(aPosition, 1.);

    gl_Position = projectionViewModel * pos;
    vPosition = gl_Position;

    shadow_computeShadowPars(model * pos);
}
