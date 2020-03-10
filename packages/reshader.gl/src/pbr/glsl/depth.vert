#define SHADER_NAME depth_vert
precision highp float;

attribute vec3 aPosition;
#include <line_extrusion_vert>

uniform mat4 uModelViewMatrix;
uniform mat4 positionMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uGlobalTexSize;
uniform vec2 uHalton;

#include <get_output>

void main() {
    mat4 localPositionMatrix = getPositionMatrix();
    #ifdef IS_LINE_EXTRUSION
        vec4 localVertex = getPosition(getLineExtrudePosition(aPosition));
    #else
        vec4 localVertex = getPosition(aPosition);
    #endif
    vec4 viewVertex = uModelViewMatrix * localPositionMatrix * localVertex;
    mat4 jitteredProjection = uProjectionMatrix;
    jitteredProjection[2].xy += uHalton.xy / uGlobalTexSize.xy;
    gl_Position = jitteredProjection * viewVertex;
}
