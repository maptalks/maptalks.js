attribute vec3 aPosition;
attribute vec3 aColor;
attribute float aSize;

uniform mat4 projViewModelMatrix;

varying vec3 vColor;

void main()
{
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    gl_PointSize = aSize;

    vColor = aColor;
}
