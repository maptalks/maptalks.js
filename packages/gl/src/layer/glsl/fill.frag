#define SHADER_NAME BACK_FILL
precision mediump float;

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_frag>
#endif

#ifdef HAS_PATTERN
    uniform sampler2D polygonPatternFile;
    varying vec2 vTexCoord;
#endif

uniform vec4 polygonFill;
uniform float polygonOpacity;
void main() {
    #ifdef HAS_PATTERN
        vec4 color = texture2D(polygonPatternFile, vTexCoord);
    #else
        vec4 color = polygonFill;
    #endif
    gl_FragColor = color * polygonOpacity;


    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        gl_FragColor.rgb = shadow_blend(gl_FragColor.rgb, shadowCoeff);
    #endif
}
