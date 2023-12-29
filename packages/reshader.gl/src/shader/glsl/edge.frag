precision mediump float;
uniform vec4 lineColor;
uniform float lineOpacity;
void main() {
    glFragColor = lineColor;
    glFragColor.a *= lineColor.a * lineOpacity;
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
