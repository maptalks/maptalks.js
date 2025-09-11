#if __VERSION__ == 100
  #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
  #endif
#endif
precision mediump float;
#include <gl2_frag>
varying vec2 vTexCoord;
uniform sampler2D sceneMap;
uniform sampler2D scanEffectMap;

void main() {
    vec4 sceneColor = texture2D(sceneMap, vTexCoord);
    vec4 scanEffectColor = texture2D(scanEffectMap, vTexCoord);
    glFragColor = sceneColor + scanEffectColor;
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
