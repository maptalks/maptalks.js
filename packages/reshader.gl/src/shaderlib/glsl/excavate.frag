#ifdef HAS_EXCAVATE_ANALYSIS
  uniform sampler2D heightmap;
  uniform float excavateHeight;
  varying vec2 vCoordinateTexcoord;
  varying float vExcavateHeight;
  const vec2 range = vec2(-100.0, 1000.0);
  float decodeHeight(const in vec4 pack) {
      return pack.r + pack.g / 255.0;
  }

  vec4 excavateColor(vec4 fragColor) {
      float samplerHeight = decodeHeight(texture2D(heightmap, vCoordinateTexcoord));
      float realHeight = samplerHeight * (range.y - range.x) + range.x;
      if(realHeight < range.x || realHeight > range.y) {
          realHeight = 0.0;
      }
      if(vExcavateHeight > realHeight) {
          discard;
      }
      return fragColor;
  }
#endif
