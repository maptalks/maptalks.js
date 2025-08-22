#define SHADER_NAME TERRAIN_MESH

precision mediump float;
uniform sampler2D skin;
uniform float polygonOpacity;
varying vec2 vUv;
#include <mask_frag>
#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_frag>
#endif
void main() {
    vec2 uv = vec2(vUv);
    uv.y = 1.0 - uv.y;
    vec4 color = texture2D(skin, uv);
    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        color.rgb = shadow_blend(color.rgb, shadowCoeff).rgb;
    #endif
    gl_FragColor = color * polygonOpacity;
    #ifdef HAS_MASK_EXTENT
      gl_FragColor = setMask(gl_FragColor);
    #endif
}
