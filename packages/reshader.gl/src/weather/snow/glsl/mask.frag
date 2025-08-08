#if __VERSION__ == 100
  #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
  #endif
#endif
precision mediump float;
#include <gl2_frag>
uniform sampler2D perlinTexture;
varying vec2 vTexCoord;
void main() {
    float snowIntense = texture2D(perlinTexture, vTexCoord).r;
    vec3 fixedC = vec3(1.0, 1.0, 1.0);
    float r = lerp(0.5, fixedC.x, snowIntense);
    float g = lerp(0.5, fixedC.y, snowIntense);
    float b = lerp(0.5, fixedC.z, snowIntense);
    glFragColor = vec4(1.0, 0.0, 0.0, 1.0);
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
