attribute vec3 aPosition;
//attribute vec2 TEXCOORD_0;
//varying vec2 TexCoords;
attribute vec3 NORMAL;

varying vec4 vFragPos;
varying vec3 vNormal;

uniform mat4 projViewModelMatrix;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;

void main()
{
    vFragPos = modelMatrix * vec4(aPosition, 1.0);
    vNormal = normalize(vec3(normalMatrix * vec4(NORMAL, 1.0)));
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
}
