#define SHADER_NAME HEATMAP

precision mediump float;

uniform highp float heatmapIntensity;
varying vec2 vExtrude;
#ifdef HAS_HEAT_WEIGHT
    varying highp float weight;
#else
    uniform highp float heatmapWeight;
#endif

#define GAUSS_COEF 0.3989422804014327
void main() {
    #ifdef HAS_HEAT_WEIGHT
        highp float heatweight = weight;
    #else
        highp float heatweight = heatmapWeight;
    #endif

    float d = -0.5 * 3.0 * 3.0 * dot(vExtrude, vExtrude);
    float val = heatweight * heatmapIntensity * GAUSS_COEF * exp(d);
    gl_FragColor = vec4(val, 1.0, 1.0, 1.0);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
