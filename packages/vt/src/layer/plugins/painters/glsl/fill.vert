#define SHADER_NAME FILL
#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

#ifdef HAS_COLOR
    attribute vec4 aColor;
    varying vec4 vColor;
#endif

#ifdef HAS_OPACITY
    attribute float aOpacity;
    varying float vOpacity;
#endif

uniform mat4 projViewModelMatrix;
#ifndef IS_VT
    uniform mat4 modelMatrix;
#endif

#ifdef HAS_PATTERN
    attribute vec4 aTexInfo;

    uniform vec2 uvOrigin;
    uniform vec2 uvScale;
    #ifdef IS_VT
        // tileRatio = extent / tileSize
        uniform float tileRatio;
        // 像素尺寸纹理时  tileResolution / mapResolution
        // 地理尺寸纹理时  tileScale = tileRatio
        uniform float tileScale;
    #else
        uniform float glScale;
    #endif

    #ifdef HAS_UV_SCALE
        attribute vec2 aUVScale;
        varying vec2 vUVScale;
    #endif

    #ifdef HAS_UV_OFFSET
        attribute vec2 aUVOffset;
        varying vec2 vUVOffset;
    #endif

    #ifdef HAS_PATTERN_WIDTH
        attribute vec2 aPatternWidth;
        varying vec2 vPatternWidth;
    #endif

    #ifdef HAS_PATTERN_ORIGIN
        attribute vec2 aPatternOrigin;
    #endif

    varying vec2 vTexCoord;
    varying vec4 vTexInfo;

    vec2 computeUV(vec2 vertex, vec2 uvSize) {
        vTexInfo = vec4(aTexInfo.xy, uvSize);
        #ifdef IS_VT
            float u = vertex.x / uvSize.x;
            float v = vertex.y / uvSize.y;
            return vec2(u, v);
        #else
            vec2 patternWidth = uvSize;
            // 等于glScale时，填充图片不会随地图缩放改变大小
            float mapGLScale = glScale;
            #ifdef HAS_PATTERN_WIDTH
                mapGLScale = 1.0;
                patternWidth = aPatternWidth;
            #endif
            vec2 origin = uvOrigin;
            #ifdef HAS_PATTERN_ORIGIN
                origin = aPatternOrigin;
            #endif
            //减去tilePoint是为了减小u和v的值，增加u和v的精度，以免在地图级别很大(scale很大)时，精度不足产生的纹理马赛克现象
            float u = (vertex.x - origin.x) * mapGLScale / patternWidth.x;
            float v = (vertex.y - origin.y) * mapGLScale / patternWidth.y;
            return vec2(u, -v);
        #endif
    }
#endif
// #ifndef ENABLE_TILE_STENCIL
//     varying vec2 vPosition;
// #endif

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif

#include <vt_position_vert>
#include <highlight_vert>

void main() {
    vec3 myPosition = unpackVTPosition();
    vec4 localVertex = vec4(myPosition, 1.);
    gl_Position = projViewModelMatrix * localVertex;

    // #ifndef ENABLE_TILE_STENCIL
    //     vPosition = aPosition.xy;
    // #endif
    #ifdef HAS_PATTERN
        vec2 origin = uvOrigin;
        #ifdef HAS_PATTERN_ORIGIN
            origin = origin - aPatternOrigin;
        #endif
        //uvSize + 1.0 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
        vec2 patternSize = aTexInfo.zw + 1.0;
        #ifdef IS_VT
            //瓦片左上角对应的纹理偏移量
            vec2 originOffset = mod(origin * uvScale * tileScale * vec2(1.0, -1.0) / patternSize, 1.0);
            vTexCoord = originOffset / uvScale + computeUV(myPosition.xy * tileScale / tileRatio, patternSize);
        #else
            vec4 position = modelMatrix * localVertex;
            vTexCoord = computeUV(position.xy, patternSize);
        #endif

        #ifdef HAS_UV_SCALE
            vUVScale = aUVScale / 255.0;
        #endif
        #ifdef HAS_PATTERN_WIDTH
            vPatternWidth = aPatternWidth;
        #endif
        #ifdef HAS_UV_OFFSET
            vUVOffset = aUVOffset / 255.0;
        #endif
    #endif

    #ifdef HAS_COLOR
        vColor = aColor / 255.0;
    #endif

    highlight_setVarying();

    #ifdef HAS_OPACITY
        vOpacity = aOpacity / 255.0;
    #endif

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        shadow_computeShadowPars(localVertex);
    #endif
}
