#define SHADER_NAME TERRAIN_MESH

attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform float minAltitude;
uniform mat4 projViewModelMatrix;
uniform mat4 projMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 positionMatrix;
uniform float heightScale;
varying vec2 vUv;
#include <mask_vert>
#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif
void main() {
    vec4 position = vec4(aPosition.xy, (aPosition.z + minAltitude) * heightScale, 1.0);
    position = positionMatrix * position;
    #ifdef HAS_MASK_EXTENT
        gl_Position = projMatrix * getMaskPosition(position, modelMatrix);
    #else
        gl_Position = projViewModelMatrix * position;
    #endif
    vUv = aTexCoord;

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        shadow_computeShadowPars(position);
    #endif
}
