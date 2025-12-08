// #define FXAA_REDUCE_MIN   (1.0/ 128.0)
// #define FXAA_REDUCE_MUL   (1.0 / 8.0)
// #define FXAA_SPAN_MAX     8.0

precision highp float;
uniform float bloomFactor;
uniform float bloomRadius;
uniform float rgbmRange;
uniform sampler2D TextureBloomBlur1;
uniform sampler2D TextureBloomBlur2;
uniform sampler2D TextureBloomBlur3;
uniform sampler2D TextureBloomBlur4;
uniform sampler2D TextureBloomBlur5;
uniform sampler2D TextureInput;
uniform sampler2D TextureSource;
uniform float enableAA;

uniform vec2 outputSize;
#define SHADER_NAME bloomCombine

vec2 gTexCoord;
#include <srgb_frag>
vec3 decodeRGBM(const in vec4 color, const in float range) {
    if(range <= 0.0) return color.rgb;
    return range * color.rgb * color.a;
}
float getRadiusFactored(const float value, const float middle) {
    return mix(value, middle * 2.0 - value, bloomRadius);
}

vec4 bloomCombine() {
    vec3 bloom = vec3(0.0);
    const float midVal = 0.6;
    const float factor1 = 1.1;
    const float factor2 = 0.9;
    const float factor3 = 0.6;
    const float factor4 = 0.3;
    const float factor5 = 0.1;
    bloom += (vec4(decodeRGBM(texture2D(TextureBloomBlur1, gTexCoord), rgbmRange), 1.0)).rgb * getRadiusFactored(factor1, midVal);
    bloom += (vec4(decodeRGBM(texture2D(TextureBloomBlur2, gTexCoord), rgbmRange), 1.0)).rgb * getRadiusFactored(factor2, midVal);
    bloom += (vec4(decodeRGBM(texture2D(TextureBloomBlur3, gTexCoord), rgbmRange), 1.0)).rgb * getRadiusFactored(factor3, midVal);
    bloom += (vec4(decodeRGBM(texture2D(TextureBloomBlur4, gTexCoord), rgbmRange), 1.0)).rgb * getRadiusFactored(factor4, midVal);
    bloom += (vec4(decodeRGBM(texture2D(TextureBloomBlur5, gTexCoord), rgbmRange), 1.0)).rgb * getRadiusFactored(factor5, midVal);
    vec4 bloomInputColor;
    if (enableAA == 1.0) {
        // TextureInput是bloom本体
        // bloomInputColor = applyFXAA(TextureInput, gl_FragCoord.xy);
    } else {
        bloomInputColor = texture2D(TextureInput, gTexCoord);
    }
    bloomInputColor.rgb = mix(vec3(0.0), bloomInputColor.rgb, sign(bloomInputColor.a));

    vec4 srcColor = texture2D(TextureSource, gTexCoord);

    float bloomAlpha = sqrt((bloom.r + bloom.g + bloom.b) / 3.0);
    vec4 bloomColor = vec4(linearTosRGB(bloom * bloomFactor), bloomAlpha);

    // srcColor 必须乘以 (1.0 - bloomInputColor.a)，否则会引起 fuzhenn/maptalks-studio#2571 中的bug
    return bloomInputColor + srcColor * (1.0 - bloomInputColor.a) + bloomColor;
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    vec4 color = bloomCombine();
    // color.rgb = linearTosRGB(color.rgb);
    gl_FragColor = color;
}
