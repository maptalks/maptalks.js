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
    uniform vec2 tileCenter;

    varying vec2 vTexCoord;
    varying vec4 vTexInfo;

    vec2 computeUV(vec2 vertex, vec2 uvSize, float scale) {
        //tileCenter是为了减小u和v的值，增加u和v的精度，以免在地图级别很大(scale很大)时，精度不足产生的纹理马赛克现象
        vec2 centerOffset = mod(tileCenter * scale / uvSize, 1.0);
        float u = (vertex.x - tileCenter.x) * scale / uvSize.x;
        float v = (vertex.y - tileCenter.y) * scale / uvSize.y;
        vTexInfo = vec4(aTexInfo.xy, uvSize);
        return vec2(u, -v) + centerOffset;
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
