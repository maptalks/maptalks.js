precision mediump float;

uniform float highlightPickingId;
uniform vec4  highlightColor;

varying float vPickingId;

void main() {
	if (highlightPickingId < 0.0 || highlightPickingId == vPickingId) {
		gl_FragColor = highlightColor;
	} else {
		discard;
	}
}
