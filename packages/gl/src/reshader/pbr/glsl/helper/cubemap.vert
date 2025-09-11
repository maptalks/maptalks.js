#define SHADER_NAME CUBE_MAP
attribute vec3 aPosition;

varying vec3 vWorldPos;

uniform mat4 projMatrix;
uniform mat4 viewMatrix;

void main()
{
    vWorldPos = aPosition;
    gl_Position =  projMatrix * viewMatrix * vec4(vWorldPos, 1.0);
}
