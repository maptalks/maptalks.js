#include <gl2_vert>
attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 projMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 positionMatrix;

varying vec2 vTexCoord;

#include <get_output>

void main()
{
    vec4 localPosition = getPosition(aPosition);
    mat4 localPositionMatrix = getPositionMatrix();
    gl_Position = projMatrix * modelViewMatrix * localPositionMatrix * localPosition;
    vTexCoord = aTexCoord;
}
