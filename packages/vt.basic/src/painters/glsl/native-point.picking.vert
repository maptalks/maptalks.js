attribute vec3 aPosition;
attribute float aSize;

uniform mat4 projViewModelMatrix;


#include <fbo_picking_vert>

void main()
{
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    gl_PointSize = aSize;

    fbo_picking_setData(gl_Position.w, true);
}
