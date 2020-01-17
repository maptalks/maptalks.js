#version 100
precision highp float;
uniform float uRGBMRange;
uniform sampler2D TextureBlurInput;
uniform sampler2D TextureInput;
uniform vec2 uBlurDir;
uniform vec2 uPixelRatio;
uniform vec2 uTextureBlurInputRatio;
uniform vec2 uTextureBlurInputSize;
uniform vec2 uTextureOutputRatio;
uniform vec2 uTextureOutputSize;
#define SHADER_NAME TextureBlurTemp0

vec2 gTexCoord;
float linearTosRGB(const in float color) {
    return  color < 0.0031308 ? color * 12.92 : 1.055 * pow(color, 1.0/2.4) - 0.055;
}
vec3 linearTosRGB(const in vec3 color) {
    return vec3( color.r < 0.0031308 ? color.r * 12.92 : 1.055 * pow(color.r, 1.0/2.4) - 0.055, color.g < 0.0031308 ? color.g * 12.92 : 1.055 * pow(color.g, 1.0/2.4) - 0.055, color.b < 0.0031308 ? color.b * 12.92 : 1.055 * pow(color.b, 1.0/2.4) - 0.055);
}
vec4 linearTosRGB(const in vec4 color) {
    return vec4( color.r < 0.0031308 ? color.r * 12.92 : 1.055 * pow(color.r, 1.0/2.4) - 0.055, color.g < 0.0031308 ? color.g * 12.92 : 1.055 * pow(color.g, 1.0/2.4) - 0.055, color.b < 0.0031308 ? color.b * 12.92 : 1.055 * pow(color.b, 1.0/2.4) - 0.055, color.a);
}
float sRGBToLinear(const in float color) {
    return  color < 0.04045 ? color * (1.0 / 12.92) : pow((color + 0.055) * (1.0 / 1.055), 2.4);
}
vec3 sRGBToLinear(const in vec3 color) {
    return vec3( color.r < 0.04045 ? color.r * (1.0 / 12.92) : pow((color.r + 0.055) * (1.0 / 1.055), 2.4), color.g < 0.04045 ? color.g * (1.0 / 12.92) : pow((color.g + 0.055) * (1.0 / 1.055), 2.4), color.b < 0.04045 ? color.b * (1.0 / 12.92) : pow((color.b + 0.055) * (1.0 / 1.055), 2.4));
}
vec4 sRGBToLinear(const in vec4 color) {
    return vec4( color.r < 0.04045 ? color.r * (1.0 / 12.92) : pow((color.r + 0.055) * (1.0 / 1.055), 2.4), color.g < 0.04045 ? color.g * (1.0 / 12.92) : pow((color.g + 0.055) * (1.0 / 1.055), 2.4), color.b < 0.04045 ? color.b * (1.0 / 12.92) : pow((color.b + 0.055) * (1.0 / 1.055), 2.4), color.a);
}
vec3 RGBMToRGB( const in vec4 rgba ) {
    const float maxRange = 8.0;
    return rgba.rgb * maxRange * rgba.a;
}
const mat3 LUVInverse = mat3( 6.0013, -2.700, -1.7995, -1.332, 3.1029, -5.7720, 0.3007, -1.088, 5.6268 );
vec3 LUVToRGB( const in vec4 vLogLuv ) {
    float Le = vLogLuv.z * 255.0 + vLogLuv.w;
    vec3 Xp_Y_XYZp;
    Xp_Y_XYZp.y = exp2((Le - 127.0) / 2.0);
    Xp_Y_XYZp.z = Xp_Y_XYZp.y / vLogLuv.y;
    Xp_Y_XYZp.x = vLogLuv.x * Xp_Y_XYZp.z;
    vec3 vRGB = LUVInverse * Xp_Y_XYZp;
    return max(vRGB, 0.0);
}
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
    vec3 pixel = 0.375 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, (min(gTexCoord.xy, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio), uRGBMRange), 1.0)).rgb;
    vec2 offset;
    vec2 blurDir = uPixelRatio.xy * uBlurDir.xy / uTextureOutputSize.xy;
    offset = blurDir * 1.2;
    pixel += 0.3125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, (min(gTexCoord.xy + offset.xy, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio), uRGBMRange), 1.0)).rgb;
    pixel += 0.3125 *  (vec4(decodeRGBM(texture2D(TextureBlurInput, (min(gTexCoord.xy - offset.xy, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio), uRGBMRange), 1.0)).rgb;
    return vec4(pixel, 1.0);
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / uTextureOutputSize.xy;
    vec4 color = gaussianBlur();
    color = encodeRGBM(color.rgb, uRGBMRange);
    gl_FragColor = color;
}
