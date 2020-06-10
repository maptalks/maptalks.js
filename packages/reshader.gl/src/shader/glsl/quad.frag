#version 100
precision mediump float;
uniform float uRGBMRange;
uniform sampler2D TextureBlurInput;
uniform vec2 uTextureOutputSize;
uniform float inputRGBM;
#define SHADER_NAME QUAD

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
void main(void) {
    gTexCoord = gl_FragCoord.xy / uTextureOutputSize.xy;
    vec3 color = decodeRGBM(texture2D(TextureBlurInput, gTexCoord.xy), uRGBMRange);
    gl_FragColor = encodeRGBM(color.rgb, uRGBMRange);
}
