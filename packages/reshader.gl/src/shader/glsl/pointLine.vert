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
#include <viewshed_vert>
#include <flood_vert>
#include <heatmap_render_vert>
#include <fog_render_vert>

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

    #ifdef HAS_VIEWSHED
        viewshed_getPositionFromViewpoint(modelMatrix * localPositionMatrix * localPosition);
    #endif

    #ifdef HAS_FLOODANALYSE
        flood_getHeight(modelMatrix * localPositionMatrix * localPosition);
    #endif

    #ifdef HAS_HEATMAP
        heatmap_compute(projMatrix * viewModelMatrix * localPositionMatrix, localPosition);
    #endif

    #ifdef HAS_FOG
        fog_getDist(modelMatrix * localPositionMatrix * localPosition);
    #endif
}
