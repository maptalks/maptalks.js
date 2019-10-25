#version 100
precision highp float;
uniform sampler2D TextureBlurInput;
uniform sampler2D TextureInput;
uniform vec2 uBlurDir;
uniform vec2 uGlobalTexSize;
uniform vec2 uPixelRatio;
uniform vec2 uTextureBlurInputRatio;
uniform vec2 uTextureBlurInputSize;
uniform vec2 uTextureOutputRatio;
uniform vec2 uTextureOutputSize;
#define SHADER_NAME TextureBlurTemp3

vec2 gTexCoord;
vec4 gaussianBlur() {
    vec3 pixel = 0.24609375 *  texture2D(TextureBlurInput, gTexCoord).rgb;
    vec2 offset;
    vec2 blurDir = uPixelRatio.xy * uBlurDir.xy / uTextureOutputSize.xy;
    blurDir *= uGlobalTexSize.y * 0.00075;
    offset = blurDir * 1.3636363636363635;
    pixel += 0.322265625 *  texture2D(TextureBlurInput, gTexCoord.xy + offset.xy).rgb;
    pixel += 0.322265625 *  texture2D(TextureBlurInput, gTexCoord.xy - offset.xy).rgb;
    offset = blurDir * 3.1818181818181817;
    pixel += 0.0537109375 *  texture2D(TextureBlurInput, gTexCoord.xy + offset.xy).rgb;
    pixel += 0.0537109375 *  texture2D(TextureBlurInput, gTexCoord.xy - offset.xy).rgb;
    return vec4(pixel, 1.0);
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / uTextureOutputSize.xy;
    vec4 color = gaussianBlur();
    gl_FragColor = color;
}
