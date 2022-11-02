#include <gl2_vert>
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

uniform mat4 projMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 positionMatrix;
#include <get_output>

void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = getPosition(aPosition);
    gl_Position = projMatrix * modelViewMatrix * localPositionMatrix * localPosition;
    vTexCoord = aTexCoord;
}
