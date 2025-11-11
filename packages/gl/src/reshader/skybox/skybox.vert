#include <gl2_vert>
attribute vec3 aPosition;

uniform mat4 projMatrix;
uniform mat4 viewMatrix;
uniform mat3 transformMatrix;

varying vec3 vWorldPos;

void main()
{
    vWorldPos = aPosition;

    mat4 rotViewMatrix = mat4(mat3(viewMatrix) * transformMatrix); // remove translation from the view matrix
    vec4 clipPos = projMatrix * rotViewMatrix * vec4(vWorldPos, 1.0);

    gl_Position = clipPos.xyww;
}
