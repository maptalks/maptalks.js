#include <gl2_vert>
attribute vec3 aPosition;
uniform mat4 projMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
//引入fbo picking的vert相关函数
#include <fbo_picking_vert>
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    gl_Position = projMatrix * modelViewMatrix * localPositionMatrix * getPosition(aPosition);
    gl_PointSize = pointSize;
    //传入gl_Position的depth值
    fbo_picking_setData(gl_Position.w, true);
}
