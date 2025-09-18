//DEPRECATED
#version 100
precision mediump float;
uniform float rgbmRange;
uniform float uBloomThreshold;
uniform sampler2D TextureInput;
uniform vec2 uTextureInputRatio;
uniform vec2 uTextureInputSize;
uniform vec2 outputSize;
#define SHADER_NAME TextureBloomExtract

const vec3 colorBright = vec3(0.2126, 0.7152, 0.0722);

vec2 gTexCoord;
float getLuminance(const in vec3 color) {
    return dot(color, colorBright);
}
vec4 extractBright(vec4 color) {
    if (color.a == 0.0) {
        return vec4(vec3(0.0), 1.0);
    }
    return vec4(clamp(color.rgb * clamp(getLuminance(color.rgb) - uBloomThreshold, 0.0, 1.0), 0.0, 1.0), 1.0);
}
vec4 bloomExtract() {
    vec4 color = texture2D(TextureInput, gTexCoord);
    return vec4(extractBright(color));
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
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    gl_FragColor = encodeRGBM(bloomExtract().rgb, rgbmRange);
}
