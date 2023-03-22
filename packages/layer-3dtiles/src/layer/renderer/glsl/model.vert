attribute vec3 aPosition;
#ifdef HAS_TEX
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
#endif

uniform mat4 projViewModelMatrix;
#ifdef USE_MAX_EXTENT
varying vec2 vXy;
#endif
// attribute vec3 aProjPosition;
// uniform mat4 depthProjModelView;

void main() {
    #ifdef USE_MAX_EXTENT
    vXy = aPosition.xy;
    #endif
    #ifdef HAS_TEX
        vTexCoord = aTexCoord;
    #endif
    vec4 pos = projViewModelMatrix * vec4(aPosition, 1.0);
    // vec4 projPos = depthProjModelView * vec4(aProjPosition, 1.0);

    gl_Position = pos;
}
