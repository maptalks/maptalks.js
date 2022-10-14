attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 projViewModelMatrix;
varying vec2 vUv;
void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    vUv = aTexCoord;
}
