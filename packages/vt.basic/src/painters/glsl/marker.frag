#define DEVICE_PIXEL_RATIO 1.0
#define EDGE_GAMMA 0.105 / DEVICE_PIXEL_RATIO

precision mediump float;

uniform sampler2D texture;
uniform lowp float markerOpacity;

varying vec2 vTexCoord;

void main() {
    gl_FragColor = texture2D(texture, vTexCoord) * markerOpacity;
}
