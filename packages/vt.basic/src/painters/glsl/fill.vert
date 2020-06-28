#define SHADER_NAME FILL
attribute vec3 aPosition;

#ifdef HAS_COLOR
    attribute vec4 aColor;
    varying vec4 vColor;
#endif

#ifdef HAS_OPACITY
    attribute float aOpacity;
    varying float vOpacity;
#endif

uniform mat4 projViewModelMatrix;

#ifdef HAS_PATTERN
    attribute vec2 aTexCoord;

    uniform float tileResolution;
    uniform float resolution;
    uniform float tileRatio;
    uniform vec2 uvScale;
    uniform vec2 uvOffset;

    varying vec2 vTexCoord;
#endif
#ifndef ENABLE_TILE_STENCIL
    varying vec2 vPosition;
#endif

#ifdef HAS_SHADOWING
    #include <vsm_shadow_vert>
#endif


void main() {
    vec4 position = vec4(aPosition, 1.);
    gl_Position = projViewModelMatrix * position;
    #ifndef ENABLE_TILE_STENCIL
        vPosition = aPosition.xy;
    #endif
    #ifdef HAS_PATTERN
        float zoomScale = tileResolution / resolution;
        // /32.0 是为提升精度，原数据都 * 32
        vTexCoord = aTexCoord / 32.0 * uvScale * zoomScale / tileRatio + uvOffset;
    #endif

    #ifdef HAS_COLOR
        vColor = aColor / 255.0;
    #endif

    #ifdef HAS_OPACITY
        vOpacity = aOpacity / 255.0;
    #endif

    #if defined(HAS_SHADOWING)
        shadow_computeShadowPars(position);
    #endif
}
