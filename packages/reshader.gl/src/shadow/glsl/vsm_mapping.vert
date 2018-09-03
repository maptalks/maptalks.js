attribute vec3 aPosition;

uniform mat4 lightProjViewModelMatrix;

varying vec4 vPosition;

void main()
{
    gl_Position = lightProjViewModelMatrix * vec4(aPosition, 1.);
    vPosition = gl_Position;
}
