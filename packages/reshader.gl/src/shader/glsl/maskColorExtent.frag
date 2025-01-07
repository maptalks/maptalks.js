#ifdef GL_ES
precision highp float;
#endif
uniform vec4 maskColor;
#ifdef HAS_VIDEO
    uniform sampler2D maskTexture;
    varying vec2 uv;
#endif
void main() {
    #ifdef HAS_VIDEO
        gl_FragColor = texture2D(maskTexture, uv);
        gl_FragColor.a = maskColor.a;
    #else
        if (maskColor.a == 0.0) {
            discard;
        }
        gl_FragColor = maskColor;
    #endif
}
