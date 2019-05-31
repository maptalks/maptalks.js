precision mediump float;

uniform vec4 polygonFill;
uniform lowp float polygonOpacity;

#ifdef HAS_PATTERN
    uniform sampler2D polygonPatternFile;
    varying vec2 vTexCoord;
#endif

void main() {
    #ifdef HAS_PATTERN
        vec4 color = texture2D(polygonPatternFile, vTexCoord);
    #else
        vec4 color = polygonFill;
    #endif
    gl_FragColor = color * polygonOpacity;
}
