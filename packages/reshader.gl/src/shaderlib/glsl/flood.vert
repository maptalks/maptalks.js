#ifdef HAS_FLOODANALYSE
    varying float flood_height;

    void flood_getHeight(vec4 worldPosition) {
        flood_height = worldPosition.z;
    }
#endif