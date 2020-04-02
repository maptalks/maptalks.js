attribute vec3 aPosition;

uniform mat4 projViewModelMatrix;
uniform float markerSize;

#include <fbo_picking_vert>

void main()
{
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    gl_PointSize = markerSize;

    fbo_picking_setData(gl_Position.w, true);
}
