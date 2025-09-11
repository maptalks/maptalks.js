precision mediump float;
#include <gl2_frag>

#if defined(HAS_COLOR0)
    varying vec4 vColor;
#endif
#include <heatmap_render_frag>
uniform vec4 baseColorFactor;
#if defined(HAS_MAP)
   #if defined(HAS_ALBEDO_MAP)
        uniform sampler2D baseColorTexture;
    #endif
    #if defined(HAS_DIFFUSE_MAP)
        uniform sampler2D diffuseTexture;
    #endif
    varying vec2 vTexCoord;
#endif
#include <mask_frag>
void main() {
    #ifdef HAS_COLOR0
        glFragColor = vColor * baseColorFactor;
    #else
        glFragColor = vec4(1.0) * baseColorFactor;
    #endif
    #ifdef HAS_MAP
        #ifdef HAS_ALBEDO_MAP
            glFragColor *= texture2D(baseColorTexture, vTexCoord);
        #endif
        #ifdef HAS_DIFFUSE_MAP
            glFragColor *= texture2D(diffuseTexture, vTexCoord);
        #endif
    #endif
    #ifdef HAS_HEATMAP
        glFragColor = heatmap_getColor(glFragColor);
    #endif
    #ifdef HAS_MASK_EXTENT
        glFragColor = setMask(glFragColor);
    #endif
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
