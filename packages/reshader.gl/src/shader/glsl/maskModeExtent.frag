#ifdef GL_ES
precision highp float;
#endif
uniform float maskMode;
uniform float flatHeight;
uniform vec2 heightRange;
void main() {
    gl_FragColor = vec4(maskMode, flatHeight, heightRange.x, heightRange.y);
}
