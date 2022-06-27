attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
uniform mat4 cut_projViewMatrixFromViewpoint;
varying vec4 cut_positionFromViewpoint;
varying vec2 v_texCoord;
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = localPositionMatrix * getPosition(aPosition);
    gl_PointSize = 1.0;
    gl_Position = projViewModelMatrix * localPosition;
    cut_positionFromViewpoint = cut_projViewMatrixFromViewpoint * modelMatrix * localPosition;
    v_texCoord = aTexCoord;
}
