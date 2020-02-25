#ifdef HAS_FLOODANALYSE
    varying float flood_height;
    uniform float flood_waterHeight;
    uniform vec3 flood_waterColor;

    void draw_floodAnalyse() {
        if (flood_height < flood_waterHeight) {
           gl_FragColor = vec4(mix(flood_waterColor, gl_FragColor.rgb, 0.6), gl_FragColor.a);
        }
    }
#endif