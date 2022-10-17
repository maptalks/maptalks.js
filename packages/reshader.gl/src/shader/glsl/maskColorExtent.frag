#ifdef GL_ES
precision highp float;
#endif
uniform vec4 maskColor;
void main() {
    gl_FragColor = maskColor;
}
