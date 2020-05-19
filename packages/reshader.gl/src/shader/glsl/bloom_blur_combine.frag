#define SHADER_NAME BLOOM_COMBINE
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D textureSource;
uniform sampler2D textureInput;
uniform sampler2D textureBloomBlur1;
uniform sampler2D textureBloomBlur2;
uniform float factor;

vec4 linearTosRGB(const in vec4 color) {
    return vec4( color.r < 0.0031308 ? color.r * 12.92 : 1.055 * pow(color.r, 1.0/2.4) - 0.055, color.g < 0.0031308 ? color.g * 12.92 : 1.055 * pow(color.g, 1.0/2.4) - 0.055, color.b < 0.0031308 ? color.b * 12.92 : 1.055 * pow(color.b, 1.0/2.4) - 0.055, color.a);
}

void main() {
    vec4 color = texture2D(textureInput, vTexCoord);
    vec4 srcColor = texture2D(textureSource, vTexCoord);

    color = vec4(srcColor.rgb * srcColor.a + color.rgb * (1.0 - srcColor.a), srcColor.a + (1.0 - srcColor.a) * color.a);

    vec4 bloom = texture2D(textureBloomBlur1, vTexCoord);
    bloom += texture2D(textureBloomBlur2, vTexCoord);
    bloom.rgb *= factor;
    bloom = linearTosRGB(bloom);

    gl_FragColor = vec4(color.rgb * color.a + bloom.rgb, color.a * color.a + bloom.a);
}
