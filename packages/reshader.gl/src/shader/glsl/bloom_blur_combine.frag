#define SHADER_NAME BLOOM_COMBINE
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D textureSource;
uniform sampler2D textureInput;
uniform sampler2D textureBloomBlur1;
uniform sampler2D textureBloomBlur2;
uniform float factor;

#include <srgb_frag>

void main() {
    vec4 color = texture2D(textureInput, vTexCoord);
    vec4 srcColor = texture2D(textureSource, vTexCoord);

    color = vec4(srcColor.rgb * srcColor.a + color.rgb * (1.0 - srcColor.a), srcColor.a + (1.0 - srcColor.a) * color.a);

    vec4 bloom = texture2D(textureBloomBlur1, vTexCoord);
    bloom += texture2D(textureBloomBlur2, vTexCoord);
    bloom.rgb *= factor;
    bloom.rgb = linearTosRGB(bloom.rgb);

    gl_FragColor = vec4(color.rgb * color.a + bloom.rgb, color.a * color.a + bloom.a);
}
