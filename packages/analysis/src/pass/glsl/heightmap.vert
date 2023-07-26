attribute vec3 aPosition;
uniform mat4 projViewModelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
#include <get_output>
varying vec4 vPosition;
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 worldPosition = modelMatrix * localPositionMatrix * getPosition(aPosition);
    vPosition = worldPosition;
    gl_Position = projViewModelMatrix * localPositionMatrix * getPosition(aPosition);
}
