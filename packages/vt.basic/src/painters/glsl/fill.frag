precision mediump float;

uniform vec4 polygonFill;
uniform lowp float polygonOpacity;
void main() {
    gl_FragColor = polygonFill * polygonOpacity;
}
