#ifdef HAS_MASK_EXTENT
    uniform vec4 mask_extent;
    uniform sampler2D mask_colorExtent;
    uniform sampler2D mask_modeExtent;
    uniform float mask_maskMode;
    uniform float mask_hasFlatOut;
    uniform mat4 viewMatrix;
    uniform float mask_heightRatio;
    uniform float mask_heightOffset;
    varying vec4 vWorldPosition;
    varying vec2 vUVInExtent;
    varying float vHeightRatio;
    varying float vHeightOffset;

    const float CLIPINSIDE_MODE = 0.2;
    const float FLATINSIDE_MODE = 0.3;
    const float FLATOUTSIDE_MODE = 0.4;
    const float ELEVATE_MODE = 0.7;

    float random (vec2 st) {
        return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123) * 0.1;
    }

    bool isInExtent(vec4 color) {
        return length(color.rgb) > 0.0;
    }

    float getFlatHeight(float maskMode, float flatHeight, float height) {
      if (maskMode <= ELEVATE_MODE && maskMode > 0.6) {
          return flatHeight + height;
      } else {
        return flatHeight;
      }
    }

    vec4 getNoErrorPosition(vec4 position, vec4 wPosition) {
      vec4 realPos = modelViewMatrix * position;//未压平，采用vm矩阵的坐标
      vec4 pos = viewMatrix * wPosition; //压平的坐标
      vec4 tempPos = viewMatrix * modelMatrix * position;//未压平而采用v*m矩阵的坐标
      float deltaX = realPos.x - tempPos.x;
      float deltaY = realPos.y - tempPos.y;
      float deltaZ = realPos.z - tempPos.z;
      pos.x = pos.x + deltaX;
      pos.y = pos.y + deltaY;
      pos.z = pos.z + deltaZ;
      return pos;
    }

    vec4 getMaskPosition(vec4 position, mat4 modelMatrix) {
        vWorldPosition = modelMatrix * position;
        float w = mask_extent.z - mask_extent.x;
        float h = mask_extent.y - mask_extent.w;
        vec2 uvInExtent = vec2((vWorldPosition.x - mask_extent.x) / abs(w), 1.0 - (vWorldPosition.y - mask_extent.w) / h);
        vec4 extentColor = texture2D(mask_colorExtent, uvInExtent);
        vec3 maskOptionColor = texture2D(mask_modeExtent, uvInExtent).rgb;
        float maskMode = maskOptionColor.r;
        float flatHeight = maskOptionColor.g / mask_heightRatio + mask_heightOffset;
        float height = getFlatHeight(maskMode, flatHeight, vWorldPosition.z);
        vec4 wPosition = vec4(vWorldPosition.x, vWorldPosition.y, height, vWorldPosition.w);
        vUVInExtent = uvInExtent;
        vHeightRatio = mask_heightRatio;
        vHeightOffset = mask_heightOffset;
        if (maskMode <= FLATOUTSIDE_MODE && maskMode > FLATINSIDE_MODE) {
            return modelViewMatrix * position;;
        } else if (mask_hasFlatOut == 1.0) {
            return getNoErrorPosition(position, wPosition);
        }
        if (isInExtent(extentColor) == true && maskMode <= FLATINSIDE_MODE && maskMode > CLIPINSIDE_MODE) {
            return getNoErrorPosition(position, wPosition);
        } if (isInExtent(extentColor) == true && maskMode <= ELEVATE_MODE && maskMode > 0.6) {
            return getNoErrorPosition(position, wPosition);
        } else {
            return modelViewMatrix * position;
        }
    }
#endif
