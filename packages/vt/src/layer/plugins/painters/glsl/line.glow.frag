#define DEVICE_PIXEL_RATIO 1.0

precision mediump float;

uniform lowp float lineOpacity;
uniform lowp vec4 lineColor;

varying vec2 vNormal;
varying vec2 vWidth;

uniform float animation;
varying float vTime;

void main() {
    if (animation == 1.0) {
        if (vTime > 1.0 || vTime < 0.0) {
            discard;
        }
    }
    float dist = length(vNormal) * vWidth.s;//outset

    float r = (vWidth.s - dist) / vWidth.s;

    gl_FragColor = lineColor * lineOpacity;

    float rrr = pow(r, 20.0);
    gl_FragColor += vec4(rrr, rrr, rrr, 0.0);
    // gl_FragColor *= smoothstep(0.0, 1.0, r);
    gl_FragColor *= pow(r, 1.5);
    if (animation == 1.0) {
        gl_FragColor *= vTime;
    }
}
