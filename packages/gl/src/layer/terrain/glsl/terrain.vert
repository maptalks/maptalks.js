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
uniform sampler2D flatMask;
#include <common_pack_float>
#include <mask_vert>
#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif
void main() {
    vec2 uv = aTexCoord;
    uv.y = 1.0 - uv.y;
    vec4 encodedHeight = texture2D(flatMask, uv);
    float altitude = aPosition.z;
    if (length(encodedHeight) < 2.0) {
        float maskHeight = decodeFloat32(encodedHeight);
        altitude = min(aPosition.z, maskHeight);
    }
    vec4 position = vec4(aPosition.xy, (altitude + minAltitude) * heightScale, 1.0);
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
