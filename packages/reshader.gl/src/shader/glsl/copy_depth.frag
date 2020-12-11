precision highp float;

#include <gl2_frag>

#define SHADER_NAME COPY_DEPTH

uniform sampler2D TextureDepth;
uniform vec2 textureSize;

#include <common_pack_float>

void main(void) {
    vec2 uv = gl_FragCoord.xy / textureSize.xy;
    float depth = texture2D(TextureDepth, uv).r;
    glFragColor = common_encodeDepth(depth);

    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
