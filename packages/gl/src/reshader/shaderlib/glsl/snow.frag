#ifdef HAS_SNOW
    float lerp(float a, float b, float w) {
        return a + w * (b - a);
    }

    vec3 snow(vec4 sceneColor, vec3 normalColor, float height) {
        float snowIntense = normalColor.b;
        vec3 fixedC = vec3(1.0, 1.0, 1.0);
        if (height < 1.0) {
            float r = lerp(0.5, fixedC.x, snowIntense);
            float g = lerp(0.5, fixedC.y, snowIntense);
            float b = lerp(0.5, fixedC.z, snowIntense);
            return vec3(r, g, b);
        } else {
            float r = lerp(sceneColor.r, fixedC.x, snowIntense);
            float g = lerp(sceneColor.g, fixedC.y, snowIntense);
            float b = lerp(sceneColor.b, fixedC.z, snowIntense);
            return vec3(r, g, b);
        }
    }
#endif
