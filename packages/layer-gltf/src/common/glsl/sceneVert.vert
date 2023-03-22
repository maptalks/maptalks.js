attribute vec3 aPosition;
attribute float aOutline;
uniform mat4 projViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform float instance;
#include <get_output>

varying float vOutline;
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    gl_Position = projViewMatrix * modelMatrix * localPositionMatrix * getPosition(aPosition);
    if (instance == 0.0) {
        vOutline = 1.0;
    } else {
        vOutline = aOutline;
    }
}
