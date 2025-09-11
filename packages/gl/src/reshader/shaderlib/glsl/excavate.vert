#ifdef HAS_EXCAVATE_ANALYSIS
  uniform vec4 excavateExtent;
  varying vec2 vCoordinateTexcoord;
  varying float vExcavateHeight;

  float getWorldHeight(vec4 localPosition) {
    vec4 wPosition = modelMatrix * localPosition;
    return wPosition.z;
  }

  vec2 getCoordinateTexcoord(vec4 localPosition) {
    vec4 wPosition = modelMatrix * localPosition;
    float x = (wPosition.x - excavateExtent.x) / (excavateExtent.z - excavateExtent.x);
    float y = (wPosition.y - excavateExtent.y) / (excavateExtent.w - excavateExtent.y);
    return vec2(x, y);
  }
#endif
