#version 100
precision highp float;
uniform float rgbmRange;
uniform sampler2D TextureBlurInput;
uniform vec2 blurDir;
uniform vec2 pixelRatio;
uniform vec2 outputSize;
#define SHADER_NAME GAUSSIAN_BLUR1

vec2 gTexCoord;

#include <rgbm_frag>

vec4 gaussianBlur() {
    vec3 pixel = 0.3125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy), rgbmRange), 1.0)).rgb;
    vec2 offset;
    vec2 blurDirection = pixelRatio.xy * blurDir.xy / outputSize.xy;
    offset = blurDirection * 1.2857142857142858;
    pixel += 0.328125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy + offset.xy), rgbmRange), 1.0)).rgb;
    pixel += 0.328125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy - offset.xy), rgbmRange), 1.0)).rgb;
    return vec4(pixel, 1.0);
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    vec4 color = gaussianBlur();
    color = encodeRGBM(color.rgb, rgbmRange);
    gl_FragColor = color;
}
