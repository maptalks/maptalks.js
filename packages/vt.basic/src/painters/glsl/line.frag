#define DEVICE_PIXEL_RATIO 1.0

precision mediump float;

uniform lowp float blur;
uniform lowp float lineOpacity;
uniform lowp vec4 lineColor;

varying vec2 vNormal;
varying vec2 vWidth;
varying float vGammaScale;

void main() {
    float dist = length(vNormal) * vWidth.s;//outset

    float blur2 = (blur + 1.0 / DEVICE_PIXEL_RATIO) * vGammaScale;
    float alpha = clamp(min(dist - (vWidth.t - blur2), vWidth.s - dist) / blur2, 0.0, 1.0);

    // vec4 color = vec4(1.0, 0.0, 0.0, 1.0);
    gl_FragColor = lineColor * (alpha * lineOpacity);
}
