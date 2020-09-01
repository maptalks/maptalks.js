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
    attribute vec4 aTexCoord;

    uniform float tileResolution;
    uniform float resolution;
    uniform float tileRatio;
    uniform vec2 uvScale;
    uniform vec2 uvOffset;

    varying vec2 vTexCoord;
    varying vec4 vTexInfo;

    vec2 computeUV(vec2 vertex, vec2 uvSize, vec2 scale, vec2 offset) {
        float u = vertex.x * scale.x;
        float v = vertex.y * scale.y;
        vTexInfo = vec4(aTexCoord.xy, uvSize);
        return (offset + vec2(u, -v)) / uvSize;
    }
#endif
#ifndef ENABLE_TILE_STENCIL
    varying vec2 vPosition;
#endif

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
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
        vec2 scale = uvScale * zoomScale / tileRatio;
        //uvSize + 1.0 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
        vTexCoord = computeUV(aPosition.xy, aTexCoord.zw + 1.0, scale, uvOffset);
    #endif

    #ifdef HAS_COLOR
        vColor = aColor / 255.0;
    #endif

    #ifdef HAS_OPACITY
        vOpacity = aOpacity / 255.0;
    #endif

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        shadow_computeShadowPars(position);
    #endif
}
