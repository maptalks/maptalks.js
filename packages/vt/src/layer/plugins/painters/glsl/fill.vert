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
uniform mat4 positionMatrix;
#ifndef IS_VT
    uniform mat4 modelMatrix;
#endif

#ifdef HAS_PATTERN
    #ifdef HAS_TEX_COORD
        attribute vec2 aTexCoord;
    #endif
    attribute vec4 aTexInfo;

    uniform vec2 patternWidth;
    uniform vec2 patternOffset;
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
    #endif

    #ifdef HAS_PATTERN_ORIGIN
        attribute vec2 aPatternOrigin;
    #endif

    #ifdef HAS_PATTERN_OFFSET
        attribute vec2 aPatternOffset;
    #endif

    varying vec2 vTexCoord;
    varying vec4 vTexInfo;

    vec2 computeUV(vec2 vertex, vec2 patternWidth) {
        #ifdef IS_VT
            float u = vertex.x / patternWidth.x;
            float v = vertex.y / patternWidth.y;
            return vec2(u, v);
        #else
            // 等于glScale时，填充图片不会随地图缩放改变大小
            float mapGLScale = glScale;
            #ifdef HAS_PATTERN_WIDTH
                float hasPatternWidth = sign(length(aPatternWidth));
                mapGLScale = mix(glScale, 1.0, hasPatternWidth);
            #endif
            vec2 origin = uvOrigin;
            #ifdef HAS_PATTERN_ORIGIN
                origin = aPatternOrigin;
            #endif
            #ifdef HAS_PATTERN_OFFSET
                vec2 myPatternOffset = aPatternOffset;
            #else
                vec2 myPatternOffset = patternOffset;
            #endif
            origin += myPatternOffset;
            //减去tilePoint是为了减小u和v的值，增加u和v的精度，以免在地图级别很大(scale很大)时，精度不足产生的纹理马赛克现象
            float u = (vertex.x - origin.x) * mapGLScale / patternWidth.x;
            float v = (vertex.y - origin.y) * mapGLScale / patternWidth.y;
            return vec2(u, -v);
        #endif
    }

    vec2 computeTexCoord(vec4 localVertex, vec2 patternSize) {
        #ifdef IS_VT
            #ifdef HAS_PATTERN_OFFSET
                vec2 myPatternOffset = aPatternOffset;
            #else
                vec2 myPatternOffset = patternOffset;
            #endif
            vec2 origin = uvOrigin + myPatternOffset;
            #ifdef HAS_PATTERN_ORIGIN
                origin = origin - aPatternOrigin * tileScale;
            #endif
            float hasPatternWidth = sign(length(patternWidth));
            vec2 myPatternWidth = mix(patternSize, patternWidth, hasPatternWidth);
            #ifdef HAS_PATTERN_WIDTH
                myPatternWidth = aPatternWidth;
            #endif
            // 没有patternWidth时
            //瓦片左上角对应的纹理偏移量, origin已经在uniform计算中考虑了tileScale（用于提升精度）
            vec2 originOffset = origin * vec2(1.0, -1.0) / myPatternWidth;

            return mod(originOffset, 1.0) + computeUV(localVertex.xy * tileScale / tileRatio, myPatternWidth);
        #else
            vec2 myPatternWidth = patternSize;
            #ifdef HAS_PATTERN_WIDTH
                float hasPatternWidth = sign(length(aPatternWidth));
                myPatternWidth = mix(patternSize, aPatternWidth, hasPatternWidth);
            #endif
            vec4 position = modelMatrix * localVertex;
            return computeUV(position.xy, myPatternWidth);
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
    gl_Position = projViewModelMatrix * positionMatrix * localVertex;

    // #ifndef ENABLE_TILE_STENCIL
    //     vPosition = aPosition.xy;
    // #endif
    #ifdef HAS_PATTERN
        //uvSize + 1.0 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
        vec2 patternSize = aTexInfo.zw + 1.0;
        vTexInfo = vec4(aTexInfo.xy, patternSize);
        #ifdef HAS_TEX_COORD
            if (aTexCoord.x == INVALID_TEX_COORD) {
                vTexCoord = computeTexCoord(localVertex, patternSize);
            } else {
                vTexCoord = aTexCoord;
            }
        #else
            vTexCoord = computeTexCoord(localVertex, patternSize);
        #endif

        #ifdef HAS_UV_SCALE
            vUVScale = aUVScale / 255.0;
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
