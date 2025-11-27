precision highp float;
uniform float rgbmRange;
uniform sampler2D TextureBlurInput;
uniform sampler2D TextureInput;
uniform vec2 blurDir;
uniform vec2 outSize;
uniform vec2 pixelRatio;
uniform vec2 outputSize;
#define SHADER_NAME GAUSSIAN_BLUR5

vec2 gTexCoord;

#include <rgbm_frag>

vec4 gaussianBlur() {
    vec3 pixel = 0.20947265625 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy), rgbmRange), 1.0)).rgb;
    vec2 offset;
    vec2 blurDirection = pixelRatio.xy * blurDir.xy / outputSize.xy;
    blurDirection *= outSize.y * 0.00075;
    offset = blurDirection * 1.4;
    pixel += 0.30548095703125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy + offset.xy), rgbmRange), 1.0)).rgb;
    pixel += 0.30548095703125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy - offset.xy), rgbmRange), 1.0)).rgb;
    offset = blurDirection * 3.2666666666666666;
    pixel += 0.08331298828125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy + offset.xy), rgbmRange), 1.0)).rgb;
    pixel += 0.08331298828125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy - offset.xy), rgbmRange), 1.0)).rgb;
    offset = blurDirection * 5.133333333333334;
    pixel += 0.00640869140625 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy + offset.xy), rgbmRange), 1.0)).rgb;
    pixel += 0.00640869140625 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy - offset.xy), rgbmRange), 1.0)).rgb;
    return vec4(pixel, 1.0);
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    vec4 color = gaussianBlur();
    color = encodeRGBM(color.rgb, rgbmRange);
    gl_FragColor = color;
}
