attribute vec3 aPosition;
uniform mat4 projViewModelMatrix;

#ifdef HAS_PATTERN
    attribute vec2 aTexCoord;
    uniform vec2 uvScale;
    uniform vec2 uvOffset;

    varying vec2 vTexCoord;
#endif

#ifdef HAS_SHADOWING
    #include <vsm_shadow_vert>
#endif

void main () {
    #ifdef HAS_PATTERN
        vTexCoord = aTexCoord * uvScale + uvOffset;
    #endif
    vec3 position = vec3(aPosition);
    gl_Position = projViewModelMatrix * vec4(position, 1.0);
    #if defined(HAS_SHADOWING)
        shadow_computeShadowPars(vec4(position, 1.0));
    #endif
}
