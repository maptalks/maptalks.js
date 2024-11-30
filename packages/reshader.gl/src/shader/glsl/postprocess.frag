precision mediump float;

varying vec2 vTexCoord;

uniform vec2 resolution;
uniform sampler2D textureSource;

uniform float enableVignette;
uniform float enableGrain;
uniform float enableLut;

//grain
uniform float timeGrain;
uniform float grainFactor;
//vegeneet
uniform vec2 lensRadius;
uniform float frameMod;
//color lut
uniform sampler2D lookupTable;

#include <srgb_frag>

//----------------grain------------------
float pseudoRandom(const in vec2 fragCoord) {
    vec3 p3 = fract(vec3(fragCoord.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}
float nrandTriangle() {
    float nrnd0 = pseudoRandom(gl_FragCoord.xy + 1000.0 * fract(timeGrain));
    float orig = nrnd0 * 2.0 - 1.0;
    nrnd0 = orig * inversesqrt(abs(orig));
    nrnd0 = max(-1.0, nrnd0);
    nrnd0 = nrnd0 - sign(orig) + 0.5;
    return (nrnd0 + 0.5) * 0.5;
}
vec4 grain(const in vec4 color) {
    float factor = nrandTriangle();
    return vec4(mix(color.rgb, color.rgb * (color.rgb + (1.0 - color.rgb) * 2.0 * factor), grainFactor), color.a);
}

//----------------vigenett----------------
float interleavedGradientNoise(const in vec2 fragCoord, const in float frameMod) {
    vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(fragCoord.xy + frameMod * vec2(47.0, 17.0) * 0.695, magic.xy)));
}

float vignetteDithered() {
    vec2 lens = lensRadius;
    lens.y = min(lens.y, lens.x - 1e-4);
    float jitter = interleavedGradientNoise(gl_FragCoord.xy, frameMod);
    jitter = (lens.x - lens.y) * (lens.x + lens.y) * 0.07 * (jitter - 0.5);
    return smoothstep(lens.x, lens.y, jitter + distance(vTexCoord, vec2(0.5)));
}
vec4 vignette(const in vec4 color) {
    float factor = vignetteDithered();
    return vec4(linearTosRGB(sRGBToLinear(color.rgb) * factor), clamp(color.a + (1.0 - factor), 0.0, 1.0));
}
//--------------------------------------
// float decodeAlpha(const in vec4 pack) {
//     return pack.a;
// }
// vec3 sharpColorFactor(const in vec3 color, const float sharp) {
//     // vec2 off = pixelRatio.xy / resolution.xy;
//     vec2 off = vec2(1.0, 1.0) / resolution.xy;
//     vec3 rgbNW = (texture2D(TextureInput, (min(vTexCoord + off * vec2(-1.0, -1.0), 1.0 - 1e+0 / resolution.xy)) * uTextureInputRatio)).rgb;
//     vec3 rgbSE = (texture2D(TextureInput, (min(vTexCoord + off * vec2(1.0, 1.0), 1.0 - 1e+0 / resolution.xy)) * uTextureInputRatio)).rgb;
//     vec3 rgbNE = (texture2D(TextureInput, (min(vTexCoord + off * vec2(1.0, -1.0), 1.0 - 1e+0 / resolution.xy)) * uTextureInputRatio)).rgb;
//     vec3 rgbSW = (texture2D(TextureInput, (min(vTexCoord + off * vec2(-1.0, 1.0), 1.0 - 1e+0 / resolution.xy)) * uTextureInputRatio)).rgb;
//     return color + sharp * (4.0 * color - rgbNW - rgbNE - rgbSW - rgbSE);
// }
// vec4 sharpen(const in vec4 color) {
//     float alpha = decodeAlpha( (texture2D(TextureDepth, (min(vTexCoord, 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)));
//     if( alpha == 0.0 ) {
//         return vec4(color.rgb, 1.0);
//     }
//     return vec4(sharpColorFactor(color.rgb, uSharpFactor * alpha), color.a);
// }
// vec4 sharpen() {
//     return sharpen( (texture2D(TextureInput, (min(vTexCoord, 1.0 - 1e+0 / resolution.xy)) * uTextureInputRatio)));
// }
//--------------------color lut----------------
// MIT license, from https://github.com/mattdesl/glsl-lut
vec4 lookup(in vec4 textureColor, in sampler2D lookupTable) {
    mediump float blueColor = textureColor.b * 63.0;

    mediump vec2 quad1;
    quad1.y = floor(floor(blueColor) / 8.0);
    quad1.x = floor(blueColor) - (quad1.y * 8.0);

    mediump vec2 quad2;
    quad2.y = floor(ceil(blueColor) / 8.0);
    quad2.x = ceil(blueColor) - (quad2.y * 8.0);

    highp vec2 texPos1;
    texPos1.x = (quad1.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.r);
    texPos1.y = (quad1.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.g);

    #ifdef LUT_FLIP_Y
        texPos1.y = 1.0-texPos1.y;
    #endif

    highp vec2 texPos2;
    texPos2.x = (quad2.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.r);
    texPos2.y = (quad2.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.g);

    #ifdef LUT_FLIP_Y
        texPos2.y = 1.0-texPos2.y;
    #endif

    lowp vec4 newColor1 = texture2D(lookupTable, texPos1);
    lowp vec4 newColor2 = texture2D(lookupTable, texPos2);

    lowp vec4 newColor = mix(newColor1, newColor2, fract(blueColor));
    return newColor;
}

void main() {
    vec4 color = texture2D(textureSource, vTexCoord);
    if (enableLut == 1.0) {
        color = lookup(color, lookupTable);
    }
    // color = sharpen(color);
    if (enableVignette == 1.0) {
        color = vignette(color);
    }
    if (enableGrain == 1.0) {
        color = grain(color);
    }
    gl_FragColor = color;
}
