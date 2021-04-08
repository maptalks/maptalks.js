precision mediump float;
#include <gl2_frag>

#if defined(HAS_COLOR0)
    varying vec4 vColor;
#endif

#include <viewshed_frag>
#include <flood_frag>
#include <heatmap_render_frag>
#include <fog_render_frag>
uniform vec4 baseColorFactor;
#if defined(HAS_MAP)
    uniform sampler2D baseColorTexture;
    varying vec2 vTexCoord;
#endif
void main() {
    #ifdef HAS_COLOR0
        glFragColor = vColor * baseColorFactor;
    #else
        glFragColor = vec4(1.0) * baseColorFactor;
    #endif
    #ifdef HAS_MAP
        glFragColor *= texture2D(baseColorTexture, vTexCoord);
    #endif
    #ifdef HAS_HEATMAP
        glFragColor = heatmap_getColor(glFragColor);
    #endif

    #ifdef HAS_VIEWSHED
        glFragColor = viewshed_draw(glFragColor);
    #endif

    #ifdef HAS_FLOODANALYSE
        glFragColor = draw_floodAnalyse(glFragColor);
    #endif

    #ifdef HAS_FOG
        glFragColor = draw_fog(glFragColor);
    #endif
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
