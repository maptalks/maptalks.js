#define SHADER_NAME SHADOW_DISPLAY

attribute vec3 aPosition;

uniform mat4 projMatrix;

uniform mat4 modelViewMatrix;
uniform vec2 halton;
uniform vec2 globalTexSize;

varying vec4 vPosition;

#include <vsm_shadow_vert>

void main() {
    vec4 pos = vec4(aPosition, 1.);

    vec4 viewVertex = modelViewMatrix * pos;
    mat4 jitteredProjection = projMatrix;
    jitteredProjection[2].xy += halton.xy / globalTexSize.xy;
    gl_Position = jitteredProjection * viewVertex;

    // gl_Position = projViewModelMatrix * pos;
    vPosition = gl_Position;

    shadow_computeShadowPars(pos);
}
