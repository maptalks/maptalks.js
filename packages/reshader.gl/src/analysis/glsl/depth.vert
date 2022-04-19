attribute vec3 aPosition;
// uniform mat4 projViewMatrix;
// uniform mat4 modelMatrix;
uniform mat4 projViewModelMatrix;
uniform mat4 positionMatrix;
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    gl_Position = projViewModelMatrix * localPositionMatrix * getPosition(aPosition);
}
