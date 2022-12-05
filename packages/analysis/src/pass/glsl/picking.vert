#include <gl2_vert>
attribute vec3 aPosition;
uniform mat4 projViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform float pointSize;
//引入fbo picking的vert相关函数
#include <fbo_picking_vert>
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    gl_Position = projViewMatrix * modelMatrix * localPositionMatrix * getPosition(aPosition);
    //传入gl_Position的depth值
    fbo_picking_setData(gl_Position.w, true);
}
