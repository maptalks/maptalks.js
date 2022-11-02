attribute vec3 aPosition;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
uniform mat4 viewshed_projViewMatrixFromViewpoint;
varying vec4 viewshed_positionFromViewpoint;
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = localPositionMatrix * getPosition(aPosition);
    viewshed_positionFromViewpoint = viewshed_projViewMatrixFromViewpoint * modelMatrix * localPosition;
    gl_PointSize = 1.0;
    gl_Position = projViewModelMatrix * localPosition;
}
