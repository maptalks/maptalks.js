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
#define SHADER_NAME TextureBlurTemp1

vec2 gTexCoord;
vec4 gaussianBlur() {
    vec3 pixel = 0.3125 *  texture2D(TextureBlurInput, gTexCoord).rgb;
    vec2 offset;
    vec2 blurDir = uPixelRatio.xy * uBlurDir.xy / uTextureOutputSize.xy;
    blurDir *= uGlobalTexSize.y * 0.00075;
    offset = blurDir * 1.2857142857142858;
    pixel += 0.328125 *  texture2D(TextureBlurInput, gTexCoord.xy + offset.xy).rgb;
    pixel += 0.328125 *  texture2D(TextureBlurInput, gTexCoord.xy - offset.xy).rgb;
    return vec4(pixel, 1.0);
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / uTextureOutputSize.xy;
    vec4 color = gaussianBlur();
    gl_FragColor = color;
}
