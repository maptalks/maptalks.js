#ifdef HAS_FOG
    varying float vFog_Dist;
    uniform vec2 fog_Dist;
    uniform vec3 fog_Color;

    void draw_fog() {
        float fogFactor = clamp((vFog_Dist - fog_Dist.x) / (fog_Dist.y - fog_Dist.x), 0.0, 1.0);
        vec3 color = mix(fog_Color, gl_FragColor.rgb, fogFactor);
        gl_FragColor = vec4(color, gl_FragColor.a);
    }
#endif