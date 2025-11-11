attribute vec3 aPosition;
uniform mat4 projMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform mat4 modelViewMatrix;
#include <get_output>
void main()
{
    vec4 localPosition = getPosition(aPosition);
    mat4 localPositionMatrix = getPositionMatrix();
    gl_Position = projMatrix * modelViewMatrix * localPositionMatrix * localPosition;
}
