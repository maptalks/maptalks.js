#define SHADER_NAME HEATMAP

uniform mat4 projViewModelMatrix;
uniform float extrudeScale;
uniform float heatmapIntensity;
attribute vec3 aPosition;
varying vec2 vExtrude;
#ifdef HAS_HEAT_WEIGHT
    attribute highp float aWeight;
    varying highp float weight;
#else
    uniform highp float heatmapWeight;
#endif
uniform mediump float heatmapRadius;

const highp float ZERO = 1.0 / 255.0 / 16.0;
#define GAUSS_COEF 0.3989422804014327
void main(void) {
    #ifdef HAS_HEAT_WEIGHT
        highp float heatweight = aWeight / 255.0;
        weight = heatweight;
    #else
        highp float heatweight = heatmapWeight;
    #endif

    mediump float radius = heatmapRadius;

    vec2 unscaledExtrude = vec2(mod(aPosition.xy, 2.0) * 2.0 - 1.0);
    float S = sqrt(-2.0 * log(ZERO / heatweight / heatmapIntensity / GAUSS_COEF)) / 3.0;
    vExtrude = S * unscaledExtrude;
    vec2 extrude = vExtrude * radius * extrudeScale;
    vec4 pos = vec4(floor(aPosition.xy * 0.5) + extrude, aPosition.z, 1);
    gl_Position = projViewModelMatrix * pos;
}
