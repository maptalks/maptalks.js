#ifdef HAS_ALTITUDE
    vec3 unpackVTPosition() {
        return vec3(aPosition, aAltitude);
    }
#else
    // 16384 is pow(2.0, 14.0)
    float position_modValue = 16384.0;
    vec3 unpackVTPosition() {
        float z = aPosition.z;
        vec2 pos = sign(aPosition.xy) * mod(abs(aPosition.xy), position_modValue);
        vec2 highs = floor(abs(aPosition.xy) / position_modValue);

        float altitude = sign(z + 0.00001) * (highs.x * 2.0 + highs.y) * pow(2.0, 15.0) + z;
        return vec3(pos, altitude);
    }
#endif
