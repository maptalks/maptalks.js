precision highp float;

uniform float highlightPickingId;
uniform vec4  highlightColor;

varying float vPickingId;

void main() {
    if (highlightPickingId < 0.0 || floor(highlightPickingId + 0.5) == floor(vPickingId + 0.5)) {
        gl_FragColor = highlightColor;
    } else {
        discard;
    }
}
