#define SHADER_NAME BACK_FILL
attribute vec3 aPosition;
uniform mat4 projViewModelMatrix;
uniform mat4 modelMatrix;

#ifdef HAS_PATTERN
    attribute vec2 aTexCoord;
    uniform vec2 uvScale;
    uniform vec2 uvOffset;

    varying vec2 vTexCoord;
#endif

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif

void main () {
    #ifdef HAS_PATTERN
        vTexCoord = aTexCoord * uvScale + uvOffset;
    #endif
    vec3 position = vec3(aPosition);
    gl_Position = projViewModelMatrix * vec4(position, 1.0);
    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        shadow_computeShadowPars(vec4(position, 1.0));
    #endif
}
