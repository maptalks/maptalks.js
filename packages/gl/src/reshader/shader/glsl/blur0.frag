#version 100
precision highp float;
uniform float rgbmRange;
uniform sampler2D TextureBlurInput;
uniform sampler2D TextureInput;
uniform vec2 blurDir;
uniform vec2 pixelRatio;
uniform vec2 outputSize;
uniform float inputRGBM;
uniform float luminThreshold;
#define SHADER_NAME GAUSSIAN_BLUR0

const vec3 colorBright = vec3(0.2126, 0.7152, 0.0722);

float getLuminance(const in vec3 color) {
    return dot(color, colorBright);
}
vec4 extractBright(vec4 color) {
    float f = max(sign(getLuminance(color.rgb) - luminThreshold), 0.0);
    return color * f;
}

vec2 gTexCoord;

vec4 encodeRGBM(const in vec3 color, const in float range) {
    vec4 rgbm;
    vec3 col = color / range;
    rgbm.a = clamp( max( max( col.r, col.g ), max( col.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = col / rgbm.a;
    return rgbm;
}
vec3 decodeRGBM(const in vec4 color, const in float range) {
    if(inputRGBM == 0.0) return color.rgb;
    return range * color.rgb * color.a;
}
vec4 gaussianBlur() {
    vec3 pixel = 0.375 *  (extractBright(vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy), rgbmRange), 1.0))).rgb;
    vec2 offset;
    vec2 blurDirection = pixelRatio.xy * blurDir.xy / outputSize.xy;
    offset = blurDirection * 1.2;
    pixel += 0.3125 *  (extractBright(vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy + offset.xy), rgbmRange), 1.0))).rgb;
    pixel += 0.3125 *  (extractBright(vec4(decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy - offset.xy), rgbmRange), 1.0))).rgb;
    return vec4(pixel, 1.0);
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    vec4 color = gaussianBlur();
    color = encodeRGBM(color.rgb, rgbmRange);
    gl_FragColor = color;
}
