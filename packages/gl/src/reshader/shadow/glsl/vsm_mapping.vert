attribute vec3 aPosition;
uniform mat4 lightProjViewModelMatrix;
uniform mat4 positionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
//引入fbo picking的vert相关函数
#include <line_extrusion_vert>
#include <get_output>
varying vec4 vPosition;
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();

    #ifdef IS_LINE_EXTRUSION
        vec3 linePosition = getLineExtrudePosition(aPosition);
        vec4 localVertex = getPosition(linePosition);
    #else
        vec4 localVertex = getPosition(aPosition);
    #endif

    gl_Position = lightProjViewModelMatrix * localPositionMatrix * localVertex;
    vPosition = gl_Position;
}
