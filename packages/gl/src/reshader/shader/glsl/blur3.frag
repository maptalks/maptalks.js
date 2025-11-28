#version 100
precision highp float;
uniform float rgbmRange;
uniform sampler2D TextureBlurInput;
uniform sampler2D TextureInput;
uniform vec2 blurDir;
uniform vec2 pixelRatio;
uniform vec2 outputSize;
#define SHADER_NAME GAUSSIAN_BLUR3

vec2 gTexCoord;

#include <rgbm_frag>

vec4 gaussianBlur() {
    vec3 pixel = 0.24609375 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy), rgbmRange), 1.0)).rgb;
    vec2 offset;
    vec2 blurDirection = pixelRatio.xy * blurDir.xy / outputSize.xy;
    offset = blurDirection * 1.3636363636363635;
    pixel += 0.322265625 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy + offset.xy), rgbmRange), 1.0)).rgb;
    pixel += 0.322265625 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy - offset.xy), rgbmRange), 1.0)).rgb;
    offset = blurDirection * 3.1818181818181817;
    pixel += 0.0537109375 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy + offset.xy), rgbmRange), 1.0)).rgb;
    pixel += 0.0537109375 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy - offset.xy), rgbmRange), 1.0)).rgb;
    return vec4(pixel, 1.0);
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    vec4 color = gaussianBlur();
    color = encodeRGBM(color.rgb, rgbmRange);
    gl_FragColor = color;
}
