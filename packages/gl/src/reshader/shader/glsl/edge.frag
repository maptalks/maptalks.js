precision mediump float;
uniform vec4 lineColor;
uniform float lineOpacity;
void main() {
    gl_FragColor = lineColor;
    gl_FragColor.a *= lineOpacity;
}
