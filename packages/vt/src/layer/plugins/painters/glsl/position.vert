#ifdef HAS_ALTITUDE
    vec3 unpackVTPosition() {
        return vec3(aPosition, aAltitude);
    }
#else
    vec3 unpackVTPosition() {
        float x = aPosition[0];
        float y = aPosition[1];
        float z = aPosition[2];

        float modValue = pow(2.0, 14.0);

        float posx = mod(x, modValue);
        float posy = mod(y, modValue);

        float highx = floor(abs(x) / modValue);
        float highy = floor(abs(y) / modValue);

        float altitude = sign(z) * (highx * 2.0 + highy) * pow(2.0, 15.0) + z;

        return vec3(posx, posy, altitude);
    }
#endif
