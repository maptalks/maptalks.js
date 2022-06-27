#if __VERSION__ == 100
  #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
  #endif
#endif
precision mediump float;
#include <gl2_frag>
varying vec2 vTexCoord;
#ifdef HAS_FLOODANALYSE
    uniform vec3 flood_waterColor;
    uniform sampler2D floodMap;
#endif
#ifdef HAS_SKYLINE
    uniform sampler2D skylineMap;
#endif
#ifdef HAS_VIEWSHED
    uniform vec4 viewshed_visibleColor;
    uniform vec4 viewshed_invisibleColor;
    uniform sampler2D viewshedMap;
#endif
#ifdef HAS_INSIGHT
    uniform vec4 insight_visibleColor;
    uniform vec4 insight_invisibleColor;
    uniform sampler2D insightMap;
#endif
#ifdef HAS_CUT
    uniform sampler2D meshesMap;
    uniform sampler2D invisibleMap;
#endif
uniform sampler2D sceneMap;

void main() {
    vec4 sceneColor = texture2D(sceneMap, vTexCoord);
    glFragColor = sceneColor;
    #ifdef HAS_VIEWSHED
        vec4 viewshedColor = texture2D(viewshedMap, vTexCoord);
        if (viewshedColor.r > 0.99) {
            glFragColor = vec4(mix(viewshed_invisibleColor.rgb, sceneColor.rgb, 0.3), sceneColor.a);
        } else if (viewshedColor.g > 0.99) {
            glFragColor = vec4(mix(viewshed_visibleColor.rgb, sceneColor.rgb, 0.3), sceneColor.a);
        } else if (viewshedColor.a < 0.01) {
            glFragColor = vec4(viewshedColor.rgb, 1.0);
        }
    #endif
    #ifdef HAS_FLOODANALYSE
        vec4 floodColor = texture2D(floodMap, vTexCoord);
        if (floodColor.r > 0.0) {
            glFragColor = vec4(mix(flood_waterColor, glFragColor.rgb, 0.6), glFragColor.a);
        }
    #endif
    #ifdef HAS_SKYLINE
        vec4 skylineColor = texture2D(skylineMap, vTexCoord);
        if (skylineColor.r > 0.0 || skylineColor.g > 0.0 || skylineColor.b > 0.0) {
            glFragColor = skylineColor;
        }
    #endif
    #ifdef HAS_INSIGHT
        vec4 insightColor = texture2D(insightMap, vTexCoord);
        if (insightColor.g > 0.0) {
            glFragColor = insight_visibleColor;
        } else if (insightColor.r > 0.0) {
            glFragColor = insight_invisibleColor;
        }
    #endif
    #ifdef HAS_CUT
        vec4 cutColor = texture2D(invisibleMap, vTexCoord);
        vec4 meshesMapColor = texture2D(meshesMap, vTexCoord);
        if (cutColor.r == 1.0 && cutColor.g == 0.0 && cutColor.b == 0.0) {
            glFragColor = meshesMapColor;
        } else if (cutColor.r == 0.0 && cutColor.g == 1.0 && cutColor.b == 0.0) {
            glFragColor = meshesMapColor;
        } else if (cutColor.r == 0.0 && cutColor.g == 0.0 && cutColor.b == 1.0) {
          glFragColor = sceneColor;
        }
    #endif
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
