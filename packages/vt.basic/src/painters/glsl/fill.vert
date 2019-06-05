attribute vec3 aPosition;

uniform mat4 projViewModelMatrix;

#ifdef HAS_PATTERN
    attribute vec2 aTexCoord;

    uniform float tileResolution;
    uniform float resolution;
    uniform float tileRatio;
    uniform vec2 uvScale;
    uniform vec2 uvOffset;

    varying vec2 vTexCoord;
#endif

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    #ifdef HAS_PATTERN
        float zoomScale = tileResolution / resolution;
        // /32.0 是为提升精度，原数据都 * 32
        vTexCoord = aTexCoord / 32.0 * uvScale * zoomScale / tileRatio + uvOffset;
    #endif
}
