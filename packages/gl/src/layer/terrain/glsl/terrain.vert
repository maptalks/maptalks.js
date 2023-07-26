#define SHADER_NAME TERRAIN_MESH

attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 projViewModelMatrix;
uniform mat4 projMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 positionMatrix;
uniform float heightScale;
varying vec2 vUv;
#include <mask_vert>
void main() {
    vec3 position = vec3(aPosition.xy, aPosition.z * heightScale);
    #ifdef HAS_MASK_EXTENT
        gl_Position = projMatrix * getMaskPosition(positionMatrix * vec4(position, 1.0), modelMatrix);
    #else
        gl_Position = projViewModelMatrix * positionMatrix * vec4(position, 1.0);
    #endif
    vUv = aTexCoord;
}
