precision mediump float;

#if defined(HAS_SHADOWING)
    #include <vsm_shadow_frag>
#endif

#ifdef HAS_PATTERN
    uniform sampler2D polygonPatternFile;
    varying vec2 vTexCoord;
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
#ifndef ENABLE_TILE_STENCIL
    varying vec2 vPosition;
#endif

void main() {
    #ifndef ENABLE_TILE_STENCIL
        //当position的x, y超出tileExtent时，丢弃该片元
        float clip = sign(tileExtent - min(tileExtent, abs(vPosition.x))) * sign(1.0 + sign(vPosition.x)) *
            sign(tileExtent - min(tileExtent, abs(vPosition.y))) * sign(1.0 + sign(vPosition.y));
        if (clip == 0.0) {
            discard;
        }
    #endif

    #ifdef HAS_PATTERN
        vec4 color = texture2D(polygonPatternFile, vTexCoord);
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

    #if defined(HAS_SHADOWING)
        float shadow = shadow_computeShadow();
        gl_FragColor.rgb *= shadow;
    #endif
}
