#define SHADER_NAME BILL_BOARD
precision mediump float;
#include <gl2_frag>

uniform sampler2D billTexture;
uniform vec2 textureSize;

varying vec2 vTexCoord;

void main() {
    glFragColor = texture2D(billTexture, vTexCoord / textureSize);

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        glFragColor.rgb = shadow_blend(glFragColor.rgb, shadowCoeff);
    #endif
    // glFragColor = vec4(vTexCoord / textureSize, 0.0, 1.0);
    // glFragColor = vec4(1.0, 0.0, 0.0, 1.0);
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
