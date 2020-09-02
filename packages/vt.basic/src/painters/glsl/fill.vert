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

uniform mat4 projViewMatrix;
uniform mat4 modelMatrix;

#ifdef HAS_PATTERN
    attribute vec4 aTexInfo;

    uniform float glScale;
    uniform float flipY;

    varying vec2 vTexCoord;
    varying vec4 vTexInfo;

    vec2 computeUV(vec2 vertex, vec2 uvSize, float scale) {
        float u = mod(vertex.x, uvSize.x) * scale;
        float v = mod(vertex.y, uvSize.y) * scale;
        vTexInfo = vec4(aTexInfo.xy, uvSize);
        return (vec2(u, -v)) / uvSize;
    }
#endif
#ifndef ENABLE_TILE_STENCIL
    varying vec2 vPosition;
#endif

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif

void main() {
    vec4 position = modelMatrix * vec4(aPosition, 1.);
    gl_Position = projViewMatrix * position;
    #ifndef ENABLE_TILE_STENCIL
        vPosition = aPosition.xy;
    #endif
    #ifdef HAS_PATTERN
        //uvSize + 1.0 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
        vTexCoord = computeUV(position.xy, aTexInfo.zw + 1.0, glScale);
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
