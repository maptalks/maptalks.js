precision mediump float;
#include <gl2_frag>

uniform sampler2D baseColorTexture;

uniform float opacity;
uniform vec4 baseColor;
uniform float alphaTest;

#ifdef HAS_DEBUG
    uniform sampler2D debugTexture;
#endif

varying vec2 vTexCoord;

void main() {
    vec4 glFragColor = texture2D(baseColorTexture, vTexCoord);
    glFragColor *= baseColor;
    #ifdef HAS_DEBUG
        vec4 debugColor = texture2D(debugTexture, vTexCoord);
        glFragColor = vec4(debugColor.rgb + glFragColor.rgb * (1.0 - debugColor.a), debugColor.a + glFragColor.a * (1.0 - debugColor.a));
    #endif
    if (glFragColor.a < alphaTest) {
        discard;
    }
    glFragColor *= opacity;
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
