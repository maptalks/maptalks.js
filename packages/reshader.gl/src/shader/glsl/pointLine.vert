attribute vec3 aPosition;
#ifdef HAS_COLOR0
    attribute vec4 aColor0;
    varying vec4 vColor;
#endif


uniform mat4 modelMatrix;
uniform mat4 positionMatrix;

uniform mat4 projViewModelMatrix;
uniform float pointSize;
#if defined(HAS_MAP)
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
#endif
#include <get_output>
#include <heatmap_render_vert>

#ifdef HAS_FLOODANALYSE
    varying float vHeight;
#endif

void main()
{
    vec4 localPosition = getPosition(aPosition);
    mat4 localPositionMatrix = getPositionMatrix();
    gl_PointSize = pointSize;
    gl_Position = projViewModelMatrix * localPositionMatrix * localPosition;
    #ifdef HAS_COLOR0
        vColor = aColor0 / 255.0;
    #endif
    #ifdef HAS_MAP
        vTexCoord = aTexCoord;
    #endif

    #ifdef HAS_HEATMAP
        heatmap_compute(projMatrix * viewModelMatrix * localPositionMatrix, localPosition);
    #endif
}
