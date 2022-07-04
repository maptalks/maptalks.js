attribute vec3 aPosition;
uniform mat4 projViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
#include <get_output>
varying float flood_height;
varying vec4 vWorldPosition;
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 worldPosition = modelMatrix * localPositionMatrix * getPosition(aPosition);
    vWorldPosition = worldPosition;
    gl_Position = projViewMatrix * worldPosition;
    flood_height = worldPosition.z;
}
