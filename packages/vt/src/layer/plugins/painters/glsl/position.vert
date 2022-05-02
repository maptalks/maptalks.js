#ifdef HAS_ALTITUDE
    vec3 unpackVTPosition() {
        return vec3(aPosition, aAltitude);
    }
#else
    vec3 unpackVTPosition() {
        float z = aPosition[2];

        float modValue = pow(2.0, 14.0);

        vec2 pos = mod(aPosition.xy, modValue);
        vec2 highs = floor(abs(aPosition.xy) / modValue);

        float altitude = sign(z) * (highs.x * 2.0 + highs.y) * pow(2.0, 15.0) + z;

        return vec3(pos, altitude);
    }
#endif
