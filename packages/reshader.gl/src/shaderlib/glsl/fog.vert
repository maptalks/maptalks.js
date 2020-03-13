#ifdef HAS_FOG
    varying float vFog_Dist;

    void fog_getDist(vec4 worldPosition) {
        vFog_Dist = worldPosition.y;
    }
#endif