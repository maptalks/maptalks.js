attribute vec3 aPosition;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = localPositionMatrix * getPosition(aPosition);
    gl_PointSize = 1.0;
    gl_Position = projViewModelMatrix * localPosition;
}
