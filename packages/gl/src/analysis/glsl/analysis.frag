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
    uniform float flood_waterOpacity;
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
#ifdef HAS_EXCAVATE
    uniform sampler2D excavateMap;
#endif
#ifdef HAS_CROSSCUT
    uniform sampler2D crosscutMap;
    uniform vec4 cutLineColor;
#endif
#ifdef HAS_HEIGHTLIMIT
    uniform vec3 limitColor;
    uniform sampler2D heightLimitMap;
#endif
uniform sampler2D sceneMap;

void main() {
    vec4 sceneColor = texture2D(sceneMap, vTexCoord);
    glFragColor = sceneColor;
    #ifdef HAS_VIEWSHED
        vec4 viewshedColor = texture2D(viewshedMap, vTexCoord);
        if (viewshedColor.r > 0.99) {
            glFragColor = vec4(mix(viewshed_invisibleColor.rgb, sceneColor.rgb, viewshed_invisibleColor.a), sceneColor.a);
        } else if (viewshedColor.g > 0.99) {
            glFragColor = vec4(mix(viewshed_visibleColor.rgb, sceneColor.rgb, viewshed_visibleColor.a), sceneColor.a);
        } else if (viewshedColor.a < 0.01) {
            glFragColor = vec4(viewshedColor.rgb, 1.0);
        }
    #endif
    #ifdef HAS_FLOODANALYSE
        vec4 floodColor = texture2D(floodMap, vTexCoord);
        if (floodColor.r > 0.0) {
            glFragColor = vec4(mix(glFragColor.rgb, flood_waterColor, flood_waterOpacity), glFragColor.a);
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
    #ifdef HAS_EXCAVATE
        vec4 excavateColor = texture2D(excavateMap, vTexCoord);
        if (excavateColor.r == 1.0 && excavateColor.g == 0.0 && excavateColor.b == 0.0) {
          glFragColor = sceneColor;
        }  else {
          glFragColor = excavateColor;
        }
    #endif
    #ifdef HAS_CROSSCUT
        vec4 crosscutColor = texture2D(crosscutMap, vTexCoord);
        if (crosscutColor.r > 0.0) {
            glFragColor = vec4(mix(cutLineColor.rgb, glFragColor.rgb, 0.99), glFragColor.a);
        }
    #endif
    #ifdef HAS_HEIGHTLIMIT
        vec4 heightLimitColor = texture2D(heightLimitMap, vTexCoord);
        if (heightLimitColor.r > 0.0) {
            glFragColor = vec4(mix(limitColor, glFragColor.rgb, 0.6), glFragColor.a);
        }
    #endif
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
