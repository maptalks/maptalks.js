#ifdef HAS_EXCAVATE_ANALYSIS
  uniform vec4 excavateExtent;
  varying vec2 vCoordinateTexcoord;
  varying float vHeight;

  float getWorldHeight() {
    vec4 wPosition = modelMatrix * getPosition(aPosition);
    return wPosition.z;
  }

  vec2 getCoordinateTexcoord() {
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 wPosition = modelMatrix * localPositionMatrix * getPosition(aPosition);
    float x = (wPosition.x - excavateExtent.x) / (excavateExtent.z - excavateExtent.x);
    float y = (wPosition.y - excavateExtent.y) / (excavateExtent.w - excavateExtent.y);
    return vec2(x, y);
  }
#endif
