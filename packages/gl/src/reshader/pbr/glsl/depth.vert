#define SHADER_NAME depth_vert
precision highp float;

attribute vec3 aPosition;
#include <line_extrusion_vert>

uniform mat4 modelViewMatrix;
uniform mat4 positionMatrix;
uniform mat4 projMatrix;
uniform vec2 outSize;
uniform vec2 halton;

#include <get_output>

void main() {
    mat4 localPositionMatrix = getPositionMatrix();
    #ifdef IS_LINE_EXTRUSION
        vec4 localVertex = getPosition(getLineExtrudePosition(aPosition));
    #else
        vec4 localVertex = getPosition(aPosition);
    #endif
    vec4 viewVertex = modelViewMatrix * localPositionMatrix * localVertex;
    mat4 jitteredProjection = projMatrix;
    jitteredProjection[2].xy += halton.xy / outSize.xy;
    gl_Position = jitteredProjection * viewVertex;
}
