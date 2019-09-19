precision mediump float;

varying vec2 vTexCoord;

uniform vec2 resolution;
uniform sampler2D textureSource;

uniform float enableVignette;
uniform float enableGrain;

//grain
uniform float timeGrain;
uniform float grainFactor;
//vegeneet
uniform vec2 lensRadius;
uniform float frameMod;

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

//--------------------------------------
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
//     // vec2 off = uPixelRatio.xy / resolution.xy;
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
void main() {
    vec4 color = texture2D(textureSource, vTexCoord);
    // color = sharpen(color);
    if (enableVignette == 1.0) {
        color = vignette(color);
    }
    if (enableGrain == 1.0) {
        color = grain(color);
    }
    gl_FragColor = color;
}
