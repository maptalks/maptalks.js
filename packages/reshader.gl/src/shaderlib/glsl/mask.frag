
#ifdef HAS_MASK_EXTENT
    uniform sampler2D mask_colorExtent;
    uniform sampler2D mask_modeExtent;
    uniform float mask_hasClipOut;
    varying float vHeightRatio;
    varying float vHeightOffset;
    varying vec2 vUVInExtent;
    varying vec4 vWorldPosition;

    bool isInExtent(vec4 color) {
        if (color.r > 0.0 || color.g > 0.0 || color.b > 0.0) {
            return true;
        } else {
            return false;
        }
    }
    
    vec4 setMask(vec4 glFragColor) {
        vec4 extentColor = texture2D(mask_colorExtent, vUVInExtent);
        vec4 modeColor = texture2D(mask_modeExtent, vUVInExtent);
        float maskMode = modeColor.r;
        float minHeight = modeColor.b / vHeightRatio + vHeightOffset;
        float maxHeight = modeColor.a / vHeightRatio + vHeightOffset;
        if (maskMode > 0.1 && maskMode <= 0.2) {
            return glFragColor;
        } else if (mask_hasClipOut == 1.0) {
            discard;
        }
        if (isInExtent(extentColor) == true && maskMode > 0.0 && maskMode <= 0.1) {
            discard;
        } else if (isInExtent(extentColor) == true && maskMode <= 0.5 && maskMode > 0.4) {
            if (minHeight == 0.0 && maxHeight == 0.0) {
                glFragColor = vec4(mix(extentColor.rgb, glFragColor.rgb, 1.0 - extentColor.a), glFragColor.a);
            } else if (vWorldPosition.z >= minHeight && vWorldPosition.z <= maxHeight) {
                glFragColor = vec4(mix(extentColor.rgb, glFragColor.rgb, 1.0 - extentColor.a), glFragColor.a);
            }
        }
        return glFragColor;
    }
#endif