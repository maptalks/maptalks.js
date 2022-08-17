attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 projViewMatrix;
uniform mat4 modelMatrix;
varying vec2 vUv;
void main() {
    gl_Position = projViewMatrix * modelMatrix * vec4(aPosition, 1.0);
    vUv = aTexCoord;
}
