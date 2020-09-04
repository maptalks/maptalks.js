#define SHADER_NAME FILL

precision mediump float;

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_frag>
#endif

#ifdef HAS_PATTERN
    uniform sampler2D polygonPatternFile;
    uniform vec2 atlasSize;
    varying vec2 vTexCoord;
    varying vec4 vTexInfo;

    vec2 computeUV() {
        vec2 uv = mod(vTexCoord, 1.0);
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

#ifdef HAS_OPACITY
    varying float vOpacity;
#else
    uniform lowp float polygonOpacity;
#endif

uniform float tileExtent;
// #ifndef ENABLE_TILE_STENCIL
//     varying vec2 vPosition;
// #endif


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

    #ifdef HAS_PATTERN
        vec2 uv = computeUV();
        vec4 color = texture2D(polygonPatternFile, uv);
    #else
        #ifdef HAS_COLOR
            vec4 color = vColor;
        #else
            vec4 color = polygonFill;
        #endif
    #endif

    #ifdef HAS_OPACITY
        gl_FragColor = color * vOpacity;
    #else
        gl_FragColor = color * polygonOpacity;
    #endif

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        gl_FragColor.rgb = shadow_blend(gl_FragColor.rgb, shadowCoeff);
    #endif

    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
