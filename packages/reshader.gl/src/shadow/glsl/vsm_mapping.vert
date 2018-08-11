attribute vec3 aPosition;

uniform mat4 lightProjViewModel;

varying vec4 vPosition;

void main()
{
    gl_Position = lightProjViewModel * vec4(aPosition, 1.);
    vPosition = gl_Position;
}
