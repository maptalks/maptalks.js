precision highp float;
#define ANISOTROPY 1
#define TEXTURED_MATERIAL 0

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
#if TEXTURED_MATERIAL == 1
    uniform vec2 textureScale;
#endif

attribute vec3 position;
attribute vec3 normal;
#if ANISOTROPY == 1
    attribute vec3 tangent;
#endif
#if TEXTURED_MATERIAL == 1
    attribute vec2 uv;
#endif

varying vec3 outWorldPosition;
varying vec3 outWorldNormal;
#if ANISOTROPY == 1
    varying vec3 outWorldTangent;
#endif
#if TEXTURED_MATERIAL == 1
    varying vec2 outUV;
#endif

void main() {
    vec4 p = vec4(position, 1.0);
    outWorldPosition = (modelMatrix * p).xyz;
    outWorldNormal = mat3(modelMatrix) * normal;
    #if ANISOTROPY == 1
        outWorldTangent = mat3(modelMatrix) * tangent;
    #endif
    #if TEXTURED_MATERIAL == 1
        outUV = uv * textureScale;
    #endif

    gl_Position = projectionMatrix * modelViewMatrix * p;
}
