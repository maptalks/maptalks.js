#ifdef HAS_TERRAIN_ALTITUDE
    attribute float aTerrainAltitude;
#endif
uniform float minAltitude;

vec3 unpackVTPosition(vec2 aPosition, float aAltitude) {
    float altitude = aAltitude;
    #ifdef HAS_TERRAIN_ALTITUDE
        // aTerrainAltitude的单位是米，在vt中需要转换为厘米
        altitude += aTerrainAltitude * 100.0;
    #endif
    altitude += minAltitude * 100.0;
    return vec3(aPosition, altitude);
}

#ifdef HAS_ALTITUDE
    vec3 unpackVTPosition(vec3 offset) {
        return unpackVTPosition(aPosition + offset.xy, aAltitude + offset.z);
    }
    vec3 unpackVTPosition() {
        return unpackVTPosition(aPosition, aAltitude);
    }
#else
    // 16384 is pow(2.0, 14.0)
    float position_modValue = 16384.0;
    float position_delta = 0.00001;

    vec3 unpackVTPosition(vec3 offset) {
        float z = aPosition.z;
        vec2 pos = sign(aPosition.xy + position_delta) * mod(abs(aPosition.xy), position_modValue);
        vec2 highs = floor(abs(aPosition.xy) / position_modValue);

        float altitude = sign(z + position_delta) * (highs.x * 2.0 + highs.y) * pow(2.0, 15.0) + z;
        return unpackVTPosition(pos + offset.xy, altitude + offset.z);
    }

    vec3 unpackVTPosition() {
        return unpackVTPosition(vec3(0.0));
    }
#endif
