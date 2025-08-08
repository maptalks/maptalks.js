#define SHADER_NAME BILL_BOARD
precision mediump float;

uniform sampler2D texture;
uniform vec2 textureSize;

varying vec2 vTexCoord;

void main() {
    gl_FragColor = texture2D(texture, vTexCoord / textureSize);

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        gl_FragColor.rgb = shadow_blend(gl_FragColor.rgb, shadowCoeff);
    #endif
    // gl_FragColor = vec4(vTexCoord / textureSize, 0.0, 1.0);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
