#define SHADER_NAME WATER

uniform mat4 modelMatrix;
uniform mat4 projViewModelMatrix;
attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform vec2 uvOffset;
uniform vec2 noiseUvOffset;
uniform vec2 uvScale;

varying vec2 vUv;
varying vec2 vNoiseUv;
varying vec3 vPos;
varying mat3 vTbnMatrix;
#ifdef HAS_SSR
    uniform mat4 modelViewMatrix;
    varying vec4 vViewVertex;
#endif

#include <highlight_vert>

mat3 getTBNMatrix(in vec3 n) {
    vec3 t = normalize(cross(n, vec3(0.0, 1.0, 0.0)));
    //变量名直接用b时，会造成混淆错误
    vec3 bi = normalize(cross(n, t));
    return mat3(t, bi, n);
}

#if defined(HAS_SHADOWING)
    #include <vsm_shadow_vert>
#endif

const vec3 NORMAL = vec3(0., 0., 1.);

void main(void) {
    vec4 localVertex = vec4(aPosition, 1.);
    vec4 vertex = modelMatrix * localVertex;
    vPos = vertex.xyz;
    vTbnMatrix = getTBNMatrix(NORMAL);
    gl_Position = projViewModelMatrix * localVertex;
    vUv = aTexCoord * uvScale + uvOffset;
    vNoiseUv = aTexCoord * uvScale * TIME_NOISE_TEXTURE_REPEAT + noiseUvOffset;

    #ifdef HAS_SSR
        vec4 viewVertex = modelViewMatrix * localVertex;
        vViewVertex = viewVertex;
    #endif

    #if defined(HAS_SHADOWING)
        shadow_computeShadowPars(localVertex);
    #endif

    highlight_setVarying();
}
