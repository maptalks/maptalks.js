#version 100
precision highp float;
uniform float rgbmRange;
uniform sampler2D TextureBlurInput;
uniform sampler2D TextureInput;
uniform vec2 blurDir;
uniform vec2 pixelRatio;
uniform vec2 outputSize;
#define SHADER_NAME GAUSSIAN_BLUR2

vec2 gTexCoord;
vec4 encodeRGBM(const in vec3 color, const in float range) {
    if(range <= 0.0) return vec4(color, 1.0);
    vec4 rgbm;
    vec3 col = color / range;
    rgbm.a = clamp( max( max( col.r, col.g ), max( col.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = col / rgbm.a;
    return rgbm;
}
vec3 decodeRGBM(const in vec4 color, const in float range) {
    if(range <= 0.0) return color.rgb;
    return range * color.rgb * color.a;
}
vec4 gaussianBlur() {
    vec3 pixel = 0.2734375 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy), rgbmRange), 1.0)).rgb;
    vec2 offset;
    vec2 blurDirection = pixelRatio.xy * blurDir.xy / outputSize.xy;
    offset = blurDirection * 1.3333333333333333;
    pixel += 0.328125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy + offset.xy), rgbmRange), 1.0)).rgb;
    pixel += 0.328125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy - offset.xy), rgbmRange), 1.0)).rgb;
    offset = blurDirection * 3.111111111111111;
    pixel += 0.03515625 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy + offset.xy), rgbmRange), 1.0)).rgb;
    pixel += 0.03515625 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy - offset.xy), rgbmRange), 1.0)).rgb;
    return vec4(pixel, 1.0);
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    vec4 color = gaussianBlur();
    color = encodeRGBM(color.rgb, rgbmRange);
    gl_FragColor = color;
}
