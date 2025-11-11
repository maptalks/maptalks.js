attribute vec3 aPosition;
uniform mat4 projViewModelMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform mat4 modelViewMatrix;
//引入fbo picking的vert相关函数
#include <fbo_picking_vert>
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = getPosition(aPosition);

    gl_Position = projViewModelMatrix * localPositionMatrix * localPosition;
    //传入gl_Position的depth值
    fbo_picking_setData(gl_Position.w, true);
}
