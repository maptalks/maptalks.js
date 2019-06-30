precision mediump float;

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

void main() {
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
}
