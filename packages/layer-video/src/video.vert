attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 projViewModelMatrix;
uniform mat4 positionMatrix;
uniform mat4 modelMatrix;
varying vec2 vTexCoords;
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = getPosition(aPosition);
    gl_Position = projViewModelMatrix * localPositionMatrix * localPosition;
    vTexCoords = aTexCoord;
}
