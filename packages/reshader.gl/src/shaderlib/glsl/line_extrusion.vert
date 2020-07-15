#ifdef IS_LINE_EXTRUSION
    #define ALTITUDE_SCALE 32767.0;
    #define EXTRUDE_SCALE 63.0;
    attribute vec2 aExtrude;
    #ifdef HAS_LINE_WIDTH
        attribute float aLineWidth;
    #else
        uniform float lineWidth;
    #endif
    #ifdef HAS_LINE_HEIGHT
        attribute float aLineHeight;
    #else
        uniform float lineHeight;
    #endif
    uniform float linePixelScale;

    vec3 getLineExtrudePosition(vec3 position) {
        #ifdef HAS_LINE_WIDTH
            float lineWidth = aLineWidth / 2.0;
        #endif
        #ifdef HAS_LINE_HEIGHT
             //aLineHeight单位是分米
            float lineHeight = aLineHeight / 10.0;
        #endif
        float halfwidth = lineWidth / 2.0;
        float outset = halfwidth;
        vec2 dist = outset * aExtrude / EXTRUDE_SCALE;
        position.z *= lineHeight / ALTITUDE_SCALE;
        return position + vec3(dist, 0.0) * linePixelScale;
    }
#endif
