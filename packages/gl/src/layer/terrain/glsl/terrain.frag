#define SHADER_NAME TERRAIN_MESH

precision mediump float;

uniform sampler2D skin;
uniform float polygonOpacity;
uniform float layerOpacity;
varying vec2 vUv;
#include <mask_frag>
#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_frag>
#endif
#if defined(HAS_COLORS)
    uniform sampler2D colorsTexture;
    uniform float colorsMin;
    uniform float colorsMax;
    varying float vAltitude;

    vec4 getColor() {
        float stop = clamp(vAltitude, colorsMin, colorsMax);
        float s = (stop - colorsMin) / (colorsMax - colorsMin);
        return texture2D(colorsTexture, vec2(s, 0.5));
    }
#else

#endif
void main() {
    vec2 uv = vec2(vUv);
    uv.y = 1.0 - uv.y;
    vec4 color = texture2D(skin, uv);
    #if defined(HAS_COLORS)
        vec4 colors = getColor();
        color *= colors;
    #endif
    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        color.rgb = shadow_blend(color.rgb, shadowCoeff).rgb;
    #endif
    gl_FragColor = color * polygonOpacity * layerOpacity;
    #ifdef HAS_MASK_EXTENT
      gl_FragColor = setMask(gl_FragColor);
    #endif
}
