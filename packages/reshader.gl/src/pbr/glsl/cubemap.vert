attribute vec3 aPosition;

varying vec3 vWorldPos;

uniform mat4 projection;
uniform mat4 view;

void main()
{
    vWorldPos = aPosition;  
    gl_Position =  projection * view * vec4(vWorldPos, 1.0);
}
