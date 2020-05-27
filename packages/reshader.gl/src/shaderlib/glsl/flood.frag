#ifdef HAS_FLOODANALYSE
    varying float flood_height;
    uniform float flood_waterHeight;
    uniform vec3 flood_waterColor;

    vec4 draw_floodAnalyse(vec4 color) {
        if (flood_height < flood_waterHeight) {
           color = vec4(mix(flood_waterColor, color.rgb, 0.6), color.a);
        }
        return color;
    }
#endif
