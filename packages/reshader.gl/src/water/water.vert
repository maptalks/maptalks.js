precision highp float;
precision highp sampler2D;
const float PI = 3.141592653589793;
uniform mat4 projMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec3 aNormal;
varying vec2 vuv;
varying vec3 vpos;
varying vec3 vnormal;
varying mat3 vtbnMatrix;
vec4 transformPosition(mat4 projMatrix, mat4 viewMatrix, vec3 pos) {
    return projMatrix * modelMatrix * viewMatrix * vec4(pos, 1.0);
}
vec3 getLocalUp(in vec3 pos, in vec3 origin) {
    return normalize(pos + origin);
}
mat3 getTBNMatrix(in vec3 n) {
    vec3 t = normalize(cross(vec3(0.0, 0.0, 1.0), n));
    vec3 b = normalize(cross(n, t));
    return mat3(t, b, n);
}
void forwardLinearDepth() {

}
void main(void) {
    vuv = aTexCoord;
    vpos = (modelMatrix * vec4(aPosition, 1.0)).xyz;
    vnormal = aNormal;
    vtbnMatrix = getTBNMatrix(vnormal);
    gl_Position = transformPosition(projMatrix, viewMatrix, vpos);
    forwardLinearDepth();
}
