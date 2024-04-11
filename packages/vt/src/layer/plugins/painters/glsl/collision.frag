precision mediump float;

varying vec4 vColor;

void main() {
    gl_FragColor = vec4(vColor.rgb, 0.5);
}
