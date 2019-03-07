attribute vec3 aPosition;

uniform mat4 projViewModelMatrix;
uniform float markerSize;

void main()
{
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    gl_PointSize = markerSize;
}
