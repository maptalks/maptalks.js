#ifdef HAS_FOG
    varying float vFog_Dist;
    uniform vec2 fog_Dist;
    uniform vec3 fog_Color;

    vec4 draw_fog(vec4 color) {
        float fogFactor = clamp((vFog_Dist - fog_Dist.x) / (fog_Dist.y - fog_Dist.x), 0.0, 1.0);
        vec3 color = mix(fog_Color, gl_FragColor.rgb, fogFactor);
        color = vec4(color, gl_FragColor.a);
        return color;
    }
#endif
