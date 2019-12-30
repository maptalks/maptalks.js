#version 100
precision highp float;
uniform sampler2D TextureDepth0;
uniform sampler2D TextureDepth1;
uniform sampler2D TextureDepth2;
uniform sampler2D TextureDepth3;
uniform sampler2D TextureDepth4;
uniform sampler2D TextureDepth5;
uniform vec2 uTextureDepth0Ratio;
uniform vec2 uTextureDepth0Size;
uniform vec2 uTextureDepth1Ratio;
uniform vec2 uTextureDepth1Size;
uniform vec2 uTextureDepth2Ratio;
uniform vec2 uTextureDepth2Size;
uniform vec2 uTextureDepth3Ratio;
uniform vec2 uTextureDepth3Size;
uniform vec2 uTextureDepth4Ratio;
uniform vec2 uTextureDepth4Size;
uniform vec2 uTextureDepth5Ratio;
uniform vec2 uTextureDepth5Size;
uniform vec2 uTextureOutputRatio;
uniform vec2 uTextureOutputSize;
uniform vec2 uNearFar;
uniform mat4 projMatrix;
#define SHADER_NAME TextureMipmapDepth

vec2 gTexCoord;
float linearizeDepth(float d) {
    return d;
}

vec3 encode24(const in float x) {
    const vec3 code = vec3(1.0, 255.0, 65025.0);
    vec3 pack = vec3(code * x);
    pack.gb = fract(pack.gb);
    pack.rg -= pack.gb * (1.0 / 256.0);
    return pack;
}
float decode24(const in vec3 x) {
    const vec3 decode = 1.0 / vec3(1.0, 255.0, 65025.0);
    return dot(x, decode);
}
float decodeDepth(const in vec4 pack) {
    // if(decodeProfile(pack) == 0) {
    //     const vec3 decode = 1.0 / vec3(1.0, 255.0, 65025.0);
    //     return dot(pack.rgb, decode);
    // }
    // return pack.r + pack.g / 255.0;
    return linearizeDepth(pack.x);
}
vec4 packMipmapDepth() {
    vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
    gTexCoord.y /= uTextureOutputRatio.y;
    float levelLog = -log2(1.0 - gTexCoord.y) + 1.0;
    float level = floor(levelLog) - 1.0;
    float pLevel = pow(2.0, level + 1.0);
    gTexCoord.x = pLevel * gTexCoord.x * 0.5;
    gTexCoord.y = pLevel * (1.0 - gTexCoord.y) - 1.0;
    if (gTexCoord.x > 1.0 || gTexCoord.y > 1.0) return result;
    if (level < 0.1) result.rgba = vec4(encode24(decodeDepth( (texture2D(TextureDepth0, (min(gTexCoord, 1.0 - 1e+0 / uTextureDepth0Size.xy)) * uTextureDepth0Ratio)))), 1.0);
    else if (level < 1.1) result.rgba = (texture2D(TextureDepth1, (min(gTexCoord, 1.0 - 1e+0 / uTextureDepth1Size.xy)) * uTextureDepth1Ratio));
    else if (level < 2.1) result.rgba = (texture2D(TextureDepth2, (min(gTexCoord, 1.0 - 1e+0 / uTextureDepth2Size.xy)) * uTextureDepth2Ratio));
    else if (level < 3.1) result.rgba = (texture2D(TextureDepth3, (min(gTexCoord, 1.0 - 1e+0 / uTextureDepth3Size.xy)) * uTextureDepth3Ratio));
    else if (level < 4.1) result.rgba = (texture2D(TextureDepth4, (min(gTexCoord, 1.0 - 1e+0 / uTextureDepth4Size.xy)) * uTextureDepth4Ratio));
    else if (level < 5.1) result.rgba = (texture2D(TextureDepth5, (min(gTexCoord, 1.0 - 1e+0 / uTextureDepth5Size.xy)) * uTextureDepth5Ratio));
    return result;
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / uTextureOutputSize.xy;
    vec4 color = packMipmapDepth();
    gl_FragColor = color;
}
