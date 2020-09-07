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
#ifndef IS_VT
    uniform mat4 modelMatrix;
#endif

#ifdef HAS_PATTERN
    attribute vec4 aTexInfo;

    uniform vec2 tilePoint;
    #ifdef IS_VT
        uniform float tileRatio;
        uniform float tileScale;
    #else
        uniform float glScale;
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
            //减去tilePoint是为了减小u和v的值，增加u和v的精度，以免在地图级别很大(scale很大)时，精度不足产生的纹理马赛克现象
            float u = (vertex.x - tilePoint.x) * glScale / uvSize.x;
            float v = (vertex.y - tilePoint.y) * glScale / uvSize.y;
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

void main() {
    vec4 localVertex = vec4(aPosition, 1.);
    gl_Position = projViewModelMatrix * localVertex;

    // #ifndef ENABLE_TILE_STENCIL
    //     vPosition = aPosition.xy;
    // #endif
    #ifdef HAS_PATTERN
        vec2 patternSize = aTexInfo.zw + 1.0;
        #ifdef IS_VT
            //瓦片左上角对应的纹理偏移量
            vec2 centerOffset = mod((tilePoint) * tileScale * vec2(1.0, -1.0) / patternSize, 1.0);
            // centerOffset.y = 1.0 - centerOffset.y;
            vTexCoord = centerOffset + computeUV(aPosition.xy * tileScale / tileRatio, patternSize);
        #else
            vec4 position = modelMatrix * vec4(aPosition, 1.);
            // vec2 centerOffset = mod(tilePoint * glScale / patternSize * vec2(1.0, -1.0), 1.0);
            //uvSize + 1.0 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
            vTexCoord = computeUV(position.xy, patternSize);
        #endif


    #endif

    #ifdef HAS_COLOR
        vColor = aColor / 255.0;
    #endif

    #ifdef HAS_OPACITY
        vOpacity = aOpacity / 255.0;
    #endif

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        shadow_computeShadowPars(localVertex);
    #endif
}
