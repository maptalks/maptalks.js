attribute vec3 aPosition;
uniform mat4 projMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform mat4 modelViewMatrix;
uniform vec2 halton;
uniform vec2 outSize;
#include <get_output>
void main()
{
    vec4 localPosition = getPosition(aPosition);
    mat4 localPositionMatrix = getPositionMatrix();
    mat4 jitteredProjection = projMatrix;
    jitteredProjection[2].xy += halton.xy / outSize.xy;
    gl_Position = jitteredProjection * modelViewMatrix * localPositionMatrix * localPosition;
}
