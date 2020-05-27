#ifdef HAS_HEATMAP

uniform sampler2D heatmap_inputTexture;
uniform sampler2D heatmap_colorRamp;
uniform float heatmap_heatmapOpacity;

varying vec2 heatmap_vTexCoord;

vec4 heatmap_getColor(vec4 color) {
    float t = texture2D(heatmap_inputTexture, heatmap_vTexCoord).r;
    vec4 heatmapColor = texture2D(heatmap_colorRamp, vec2(t, 0.5)) * heatmap_heatmapOpacity;
    return color * (1.0 - heatmapColor.a) + heatmapColor * heatmapColor.a;
}

#endif
