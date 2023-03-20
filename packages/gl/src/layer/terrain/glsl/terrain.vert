#define SHADER_NAME TERRAIN_SKIN

attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 projViewModelMatrix;
uniform float heightScale;
varying vec2 vUv;
void main() {
    vec3 position = vec3(aPosition.xy, aPosition.z * heightScale);
    gl_Position = projViewModelMatrix * vec4(position, 1.0);
    vUv = aTexCoord;
}
