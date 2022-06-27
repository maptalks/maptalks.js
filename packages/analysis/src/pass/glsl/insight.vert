attribute vec3 aPosition;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
uniform mat4 insight_projViewMatrixFromViewpoint;
varying vec4 insight_positionFromViewpoint;
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = localPositionMatrix * getPosition(aPosition);
    gl_Position = projViewModelMatrix * localPosition;
    insight_positionFromViewpoint = insight_projViewMatrixFromViewpoint * modelMatrix * localPosition;
}
