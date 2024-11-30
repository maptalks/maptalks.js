//DEPRECATED
#version 100
precision highp float;
uniform float inputRGBM;
uniform float rgbmRange;
uniform sampler2D TextureInput;
uniform sampler2D TextureRefractionBlur0;
uniform sampler2D TextureRefractionBlur1;
uniform sampler2D TextureRefractionBlur2;
uniform sampler2D TextureRefractionBlur3;
uniform sampler2D TextureRefractionBlur4;
uniform sampler2D TextureRefractionBlur5;
uniform sampler2D TextureRefractionBlur6;
uniform sampler2D TextureRefractionBlur7;
uniform vec2 uTextureOutputRatio;
uniform vec2 outputSize;
uniform vec2 uTextureRefractionBlur0Ratio;
uniform vec2 uTextureRefractionBlur0Size;
uniform vec2 uTextureRefractionBlur1Ratio;
uniform vec2 uTextureRefractionBlur1Size;
uniform vec2 uTextureRefractionBlur2Ratio;
uniform vec2 uTextureRefractionBlur2Size;
uniform vec2 uTextureRefractionBlur3Ratio;
uniform vec2 uTextureRefractionBlur3Size;
uniform vec2 uTextureRefractionBlur4Ratio;
uniform vec2 uTextureRefractionBlur4Size;
uniform vec2 uTextureRefractionBlur5Ratio;
uniform vec2 uTextureRefractionBlur5Size;
uniform vec2 uTextureRefractionBlur6Ratio;
uniform vec2 uTextureRefractionBlur6Size;
uniform vec2 uTextureRefractionBlur7Ratio;
uniform vec2 uTextureRefractionBlur7Size;
#define SHADER_NAME TextureReflected

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
vec4 packMipmapRefraction() {
    vec4 result = vec4(0.0, 0.0, 0.0, 1.0);
    gTexCoord.y /= uTextureOutputRatio.y;
    float levelLog = -log2(1.0 - gTexCoord.y) + 1.0;
    float level = floor(levelLog) - 1.0;
    float pLevel = pow(2.0, level + 1.0);
    gTexCoord.x = pLevel * gTexCoord.x * 0.5;
    gTexCoord.y = pLevel * (1.0 - gTexCoord.y) - 1.0;
    if (gTexCoord.x > 1.0 || gTexCoord.y > 1.0) return result;
    if (level < 0.1) {
        if (inputRGBM == 0.0) {
            result.rgb = texture2D(TextureRefractionBlur0, (min(gTexCoord, 1.0 - 1e+0 / uTextureRefractionBlur0Size.xy)) * uTextureRefractionBlur0Ratio).rgb;
        } else {
            result.rgb = (vec4(decodeRGBM(texture2D(TextureRefractionBlur0, (min(gTexCoord, 1.0 - 1e+0 / uTextureRefractionBlur0Size.xy)) * uTextureRefractionBlur0Ratio), rgbmRange), 1.0)).rgb;
        }
    }
    else if (level < 1.1) result.rgb = (vec4(decodeRGBM(texture2D(TextureRefractionBlur1, (min(gTexCoord, 1.0 - 1e+0 / uTextureRefractionBlur1Size.xy)) * uTextureRefractionBlur1Ratio), rgbmRange), 1.0)).rgb;
    else if (level < 2.1) result.rgb = (vec4(decodeRGBM(texture2D(TextureRefractionBlur2, (min(gTexCoord, 1.0 - 1e+0 / uTextureRefractionBlur2Size.xy)) * uTextureRefractionBlur2Ratio), rgbmRange), 1.0)).rgb;
    else if (level < 3.1) result.rgb = (vec4(decodeRGBM(texture2D(TextureRefractionBlur3, (min(gTexCoord, 1.0 - 1e+0 / uTextureRefractionBlur3Size.xy)) * uTextureRefractionBlur3Ratio), rgbmRange), 1.0)).rgb;
    else if (level < 4.1) result.rgb = (vec4(decodeRGBM(texture2D(TextureRefractionBlur4, (min(gTexCoord, 1.0 - 1e+0 / uTextureRefractionBlur4Size.xy)) * uTextureRefractionBlur4Ratio), rgbmRange), 1.0)).rgb;
    else if (level < 5.1) result.rgb = (vec4(decodeRGBM(texture2D(TextureRefractionBlur5, (min(gTexCoord, 1.0 - 1e+0 / uTextureRefractionBlur5Size.xy)) * uTextureRefractionBlur5Ratio), rgbmRange), 1.0)).rgb;
    else if (level < 6.1) result.rgb = (vec4(decodeRGBM(texture2D(TextureRefractionBlur6, (min(gTexCoord, 1.0 - 1e+0 / uTextureRefractionBlur6Size.xy)) * uTextureRefractionBlur6Ratio), rgbmRange), 1.0)).rgb;
    else if (level < 7.1) result.rgb = (vec4(decodeRGBM(texture2D(TextureRefractionBlur7, (min(gTexCoord, 1.0 - 1e+0 / uTextureRefractionBlur7Size.xy)) * uTextureRefractionBlur7Ratio), rgbmRange), 1.0)).rgb;
    return result;
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    vec4 color = packMipmapRefraction();
    color = encodeRGBM(color.rgb, rgbmRange);
    gl_FragColor = color;
}
