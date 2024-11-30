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
#ifdef HAS_NOAA_TEX
    uniform sampler2D noAaTextureSource;
#endif
#ifdef HAS_POINT_TEX
    uniform sampler2D pointTextureSource;
#endif
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

// vec4 applyFXAA(sampler2D tex, vec2 fragCoord) {
//     vec4 color;
//     mediump vec2 inverseVP = vec2(1.0 / outputSize.x, 1.0 / outputSize.y);
//     vec3 rgbNW = texture2D(tex, (fragCoord + vec2(-1.0, -1.0)) * inverseVP).xyz;
//     vec3 rgbNE = texture2D(tex, (fragCoord + vec2(1.0, -1.0)) * inverseVP).xyz;
//     vec3 rgbSW = texture2D(tex, (fragCoord + vec2(-1.0, 1.0)) * inverseVP).xyz;
//     vec3 rgbSE = texture2D(tex, (fragCoord + vec2(1.0, 1.0)) * inverseVP).xyz;
//     vec4 texColor = texture2D(tex, fragCoord  * inverseVP);
//     vec3 rgbM  = texColor.xyz;
//     vec3 luma = vec3(0.299, 0.587, 0.114);
//     float lumaNW = dot(rgbNW, luma);
//     float lumaNE = dot(rgbNE, luma);
//     float lumaSW = dot(rgbSW, luma);
//     float lumaSE = dot(rgbSE, luma);
//     float lumaM  = dot(rgbM,  luma);
//     float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
//     float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

//     mediump vec2 dir;
//     dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
//     dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

//     float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
//                         (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

//     float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
//     dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
//             max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
//             dir * rcpDirMin)) * inverseVP;

//     vec4 rgbA = 0.5 * (
//         texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)) +
//         texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)));
//     vec4 rgbB = rgbA * 0.5 + 0.25 * (
//         texture2D(tex, fragCoord * inverseVP + dir * -0.5) +
//         texture2D(tex, fragCoord * inverseVP + dir * 0.5));

//     float lumaB = dot(rgbB.xyz, luma);
//     if ((lumaB < lumaMin) || (lumaB > lumaMax))
//         color = rgbA;
//     else
//         color = rgbB;
//     return color;
// }

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
    #ifdef HAS_NOAA_TEX
      vec4 noAaColor = texture2D(noAaTextureSource, gTexCoord);
      srcColor = noAaColor + srcColor * (1.0 - noAaColor.a);
    #endif

    vec4 pointColor = vec4(0.0);
    #ifdef HAS_POINT_TEX
        pointColor = texture2D(pointTextureSource, gTexCoord);
    #endif

    float bloomAlpha = sqrt((bloom.r + bloom.g + bloom.b) / 3.0);
    vec4 bloomColor = vec4(linearTosRGB(bloom * bloomFactor), bloomAlpha);

    // srcColor 必须乘以 (1.0 - bloomInputColor.a)，否则会引起 fuzhenn/maptalks-studio#2571 中的bug
    return pointColor + (bloomInputColor + srcColor * (1.0 - bloomInputColor.a)) * (1.0 - pointColor.a) + bloomColor;
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    vec4 color = bloomCombine();
    // color.rgb = linearTosRGB(color.rgb);
    gl_FragColor = color;
}
