#ifdef HAS_HEATMAP

varying vec2 heatmap_vTexCoord;

void heatmap_compute(mat4 matrix, vec3 position) {
    vec4 pos = matrix * vec4(position.xy, 0., 1.);
    heatmap_vTexCoord = (1. + pos.xy / pos.w) / 2.;
}

#endif
