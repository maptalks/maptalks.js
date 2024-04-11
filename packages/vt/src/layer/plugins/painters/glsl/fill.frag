#define SHADER_NAME FILL

precision mediump float;

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_frag>
#endif

#ifdef HAS_PATTERN
    #ifdef HAS_UV_SCALE
        varying vec2 vUVScale;
    #else
        uniform highp vec2 uvScale;
    #endif

    #ifdef HAS_UV_OFFSET
        varying vec2 vUVOffset;
    #else
        uniform vec2 uvOffset;
    #endif
#endif

#ifdef HAS_PATTERN
    uniform sampler2D polygonPatternFile;
    uniform vec2 atlasSize;
    varying vec2 vTexCoord;
    varying vec4 vTexInfo;

    vec2 computeUV() {
        #ifdef HAS_UV_SCALE
            vec2 myUVScale = vUVScale;
        #else
            vec2 myUVScale = uvScale;
        #endif
        #ifdef HAS_UV_OFFSET
            vec2 myUVOffset = vUVOffset;
        #else
            vec2 myUVOffset = uvOffset;
        #endif
        vec2 uv = mod(vTexCoord * myUVScale + myUVOffset, 1.0);
        vec2 uvStart = vTexInfo.xy;
        vec2 uvSize = vTexInfo.zw;
        return (uvStart + uv * uvSize) / atlasSize;
    }
#endif


#ifdef HAS_COLOR
    varying vec4 vColor;
#else
    uniform vec4 polygonFill;
#endif

#include <highlight_frag>

#ifdef HAS_OPACITY
    varying float vOpacity;
#else
    uniform lowp float polygonOpacity;
#endif
uniform float layerOpacity;

uniform float tileExtent;
// #ifndef ENABLE_TILE_STENCIL
//     varying vec2 vPosition;
// #endif
// uniform lowp float blendSrcIsOne;

void main() {
    // #ifndef ENABLE_TILE_STENCIL
    //     //当position的x, y超出tileExtent时，丢弃该片元
    //     float clipExtent = tileExtent;
    //     float clip = sign(clipExtent - min(clipExtent, abs(vPosition.x))) * sign(1.0 + sign(vPosition.x)) *
    //         sign(clipExtent - min(clipExtent, abs(vPosition.y))) * sign(1.0 + sign(vPosition.y));
    //     if (clip == 0.0) {
    //         discard;
    //     }
    // #endif

    #ifdef HAS_COLOR
        vec4 color = vColor;
    #else
        vec4 color = polygonFill;
    #endif

    #ifdef HAS_PATTERN
        if (vTexInfo.z * vTexInfo.w > 1.0) {
            vec2 uv = computeUV();
            color = texture2D(polygonPatternFile, uv);
        }
    #endif

    #ifdef HAS_OPACITY
        gl_FragColor = color * vOpacity;
    #else
        // gl_FragColor = vec4(color.rgb, color.a * polygonOpacity);
        gl_FragColor = color * polygonOpacity;
    #endif
    gl_FragColor *= layerOpacity;

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        gl_FragColor.rgb = shadow_blend(gl_FragColor.rgb, shadowCoeff);
    #endif

    gl_FragColor = highlight_blendColor(gl_FragColor);

    // if (blendSrcIsOne == 1.0) {
    //     gl_FragColor *= gl_FragColor.a;
    // }
    // gl_FragColor = vec4(vUVScale, 0.0, 1.0);
}
