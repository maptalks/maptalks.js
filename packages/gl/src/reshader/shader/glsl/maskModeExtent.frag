#ifdef GL_ES
    precision highp float;
#endif
uniform float maskMode;
#ifdef HAS_MASK_FLAT
    uniform float flatHeight;
#endif
#ifdef HAS_MASK_COLOR
    uniform vec2 heightRange;
#endif
void main() {
    #if defined(HAS_MASK_FLAT)
        gl_FragColor = vec4(maskMode, flatHeight, 0.0, 1.0);
    #elif defined(HAS_MASK_COLOR)
        gl_FragColor = vec4(maskMode, 0.0, heightRange.x, heightRange.y);
    #else
        gl_FragColor = vec4(maskMode, 0.0, 0.0, 0.0);
    #endif
}
