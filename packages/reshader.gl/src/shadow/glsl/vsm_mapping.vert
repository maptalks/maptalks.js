attribute vec3 aPosition;
uniform mat4 lightProjViewModelMatrix;
uniform mat4 positionMatrix;
//引入fbo picking的vert相关函数
#include <get_output>
varying vec4 vPosition;
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = getPosition(aPosition);

    gl_Position = lightProjViewModelMatrix * localPositionMatrix * localPosition;
    vPosition = gl_Position;
}
