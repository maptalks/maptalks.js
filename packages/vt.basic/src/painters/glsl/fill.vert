#ifdef IS_2D_POSITION
    attribute vec2 aPosition;
#else
    attribute vec3 aPosition;
#endif

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
    #ifdef IS_2D_POSITION
        vec3 position = vec3(aPosition, 0.0);
    #else
        vec3 position = aPosition;
    #endif
    gl_Position = projViewModelMatrix * vec4(position, 1.0);
    #ifdef HAS_PATTERN
        float zoomScale = tileResolution / resolution;
        // /32.0 是为提升精度，原数据都 * 32
        vTexCoord = aTexCoord / 32.0 * uvScale * zoomScale / tileRatio + uvOffset;
    #endif
}
