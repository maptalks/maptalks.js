#define SHADER_NAME PNTS
precision mediump float;

uniform float layerOpacity;
varying vec4 vColor;

void main() {
    vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
    if (dot(circCoord, circCoord) > 1.0) {
        discard;
    } else {
        gl_FragColor = vColor;
    }
    #ifdef HAS_LAYER_OPACITY
        gl_FragColor *= layerOpacity;
    #endif
}
