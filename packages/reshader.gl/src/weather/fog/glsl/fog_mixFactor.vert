attribute vec3 aPosition;

uniform mat4 projMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 positionMatrix;

varying vec4 vWorldPosition;
#include <get_output>

void main()
{
    vec4 localPosition = getPosition(aPosition);
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 worldPosition = modelMatrix * localPositionMatrix * localPosition;
    gl_Position = projMatrix * modelViewMatrix * localPositionMatrix * localPosition;
    vWorldPosition = worldPosition;
}
