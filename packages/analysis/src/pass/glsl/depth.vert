#include <gl2_vert>
attribute vec3 aPosition;
// uniform mat4 projViewMatrix;
// uniform mat4 modelMatrix;
uniform mat4 projViewModelMatrix;
uniform mat4 positionMatrix;
varying vec2 vHighPrecisionZW;
#include <get_output>
varying float vFragDepth;

void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    gl_Position = projViewModelMatrix * localPositionMatrix * getPosition(aPosition);
    vFragDepth = 1.0 + gl_Position.w;
    vHighPrecisionZW = gl_Position.zw;
}
