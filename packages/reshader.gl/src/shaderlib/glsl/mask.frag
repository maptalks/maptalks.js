
#ifdef HAS_MASK_EXTENT
    uniform sampler2D mask_colorExtent;
    uniform sampler2D mask_modeExtent;
    uniform float mask_hasClipOut;
    varying float vHeightRatio;
    varying float vHeightOffset;
    varying vec2 vUVInExtent;
    varying vec4 vWorldPosition;

    const float CLIPINSIDE_MODE = 0.1;
    const float CLIPOUTSIDE_MODE = 0.2;
    const float FLATINSIDE_MODE = 0.3;
    const float FLATOUTSIDE_MODE = 0.4;
    const float COLOR_MODE = 0.5;
    const float VIDEO_MODE = 0.6;
    bool isInExtent(vec4 color) {
        return length(color.rgb) > 0.0;
    }

    vec4 setMask(vec4 glFragColor) {
        vec4 extentColor = texture2D(mask_colorExtent, vUVInExtent);
        // mask可能重叠
        vec4 modeColor = texture2D(mask_modeExtent, vUVInExtent);
        float maskMode = modeColor.r;
        float minHeight = modeColor.b / vHeightRatio + vHeightOffset;
        float maxHeight = modeColor.a / vHeightRatio + vHeightOffset;
        // 因为精度问题，输入为outside mode时，纹理上的取值不一定精确，所以需要给定范围内的判断
        if (maskMode > CLIPINSIDE_MODE && maskMode <= CLIPOUTSIDE_MODE) {
            if (minHeight == 0.0 && maxHeight == 0.0) {
                return glFragColor;
            } else if (vWorldPosition.z >= minHeight && vWorldPosition.z <= maxHeight) {
                return glFragColor;
            } else {
              discard;
            }
        } else if (mask_hasClipOut == 1.0) {
            discard;
        }
        if (isInExtent(extentColor) == true && maskMode <= CLIPINSIDE_MODE && maskMode > 0.0) {
            if (minHeight == 0.0 && maxHeight == 0.0) {
                discard;
            } else if (vWorldPosition.z >= minHeight && vWorldPosition.z <= maxHeight) {
                discard;
            } else {
              return glFragColor;
            }
        } else if (isInExtent(extentColor) == true && maskMode <= VIDEO_MODE && maskMode > FLATOUTSIDE_MODE) {
            if (minHeight == 0.0 && maxHeight == 0.0) {
                glFragColor = vec4(mix(extentColor.rgb, glFragColor.rgb, 1.0 - extentColor.a), glFragColor.a);
            } else if (vWorldPosition.z >= minHeight && vWorldPosition.z <= maxHeight) {
                glFragColor = vec4(mix(extentColor.rgb, glFragColor.rgb, 1.0 - extentColor.a), glFragColor.a);
            }
        }
        return glFragColor;
    }
#endif
