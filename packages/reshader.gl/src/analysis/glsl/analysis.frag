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
uniform sampler2D sceneMap;

void main() {
    vec4 sceneColor = texture2D(sceneMap, vTexCoord);
    glFragColor = sceneColor;
    #ifdef HAS_VIEWSHED
        vec4 viewshedColor = texture2D(viewshedMap, vTexCoord);
        if (viewshedColor.r > 0.0) {
            glFragColor = viewshed_invisibleColor;
        } else if (viewshedColor.g > 0.0) {
            glFragColor = viewshed_visibleColor;
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
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
