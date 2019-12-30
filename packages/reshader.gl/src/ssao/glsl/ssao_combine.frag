#version 100
precision highp float;
uniform float uRGBMRange;
uniform sampler2D TextureBlurInput;
uniform sampler2D TextureInput;
uniform vec2 uTextureBlurInputRatio;
uniform vec2 uTextureBlurInputSize;
uniform vec2 uTextureInputRatio;
uniform vec2 uTextureInputSize;
uniform vec2 uTextureOutputRatio;
uniform vec2 uTextureOutputSize;
#define SHADER_NAME ssaoBlurV_combine

vec2 gTexCoord;
vec3 decodeRGBM(const in vec4 color, const in float range) {
    if(range <= 0.0) return color.rgb;
    return range * color.rgb * color.a;
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
vec4 ssaoBlur(const in vec2 axis) {
    vec2 uv = gTexCoord;
    vec4 aoDepth = (texture2D(TextureBlurInput, (min(uv, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio));
    if(aoDepth.x == 1.0) {
        return aoDepth;
    }
    float initialZ = decode24(aoDepth.xyz);
    float gaussian[3 + 2];
    gaussian[0] = 0.153170;
    gaussian[1] = 0.144893;
    gaussian[2] = 0.122649;
    gaussian[3] = 0.092902;
    gaussian[4] = 0.0;
    float totalWeight = gaussian[0];
    float sum = aoDepth.a * totalWeight;
    float sharpnessFactor = 400.0;
    vec2 ofs;
    float z;
    float weight;
    vec4 sampleTex;
    sampleTex = (texture2D(TextureBlurInput, (min(uv + axis * float(-3) * 2.0, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio));
    z = decode24(sampleTex.xyz);
    weight = max(0.0, 1.0 - sharpnessFactor * abs(z - initialZ)) * (0.3 + gaussian[ 3]);
    sum += weight * sampleTex.a;
    totalWeight += weight;;
    sampleTex = (texture2D(TextureBlurInput, (min(uv + axis * float(-2) * 2.0, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio));
    z = decode24(sampleTex.xyz);
    weight = max(0.0, 1.0 - sharpnessFactor * abs(z - initialZ)) * (0.3 + gaussian[ 2]);
    sum += weight * sampleTex.a;
    totalWeight += weight;;
    sampleTex = (texture2D(TextureBlurInput, (min(uv + axis * float(-1) * 2.0, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio));
    z = decode24(sampleTex.xyz);
    weight = max(0.0, 1.0 - sharpnessFactor * abs(z - initialZ)) * (0.3 + gaussian[ 1]);
    sum += weight * sampleTex.a;
    totalWeight += weight;;
    sampleTex = (texture2D(TextureBlurInput, (min(uv + axis * float(1) * 2.0, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio));
    z = decode24(sampleTex.xyz);
    weight = max(0.0, 1.0 - sharpnessFactor * abs(z - initialZ)) * (0.3 + gaussian[ 1]);
    sum += weight * sampleTex.a;
    totalWeight += weight;;
    sampleTex = (texture2D(TextureBlurInput, (min(uv + axis * float(2) * 2.0, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio));
    z = decode24(sampleTex.xyz);
    weight = max(0.0, 1.0 - sharpnessFactor * abs(z - initialZ)) * (0.3 + gaussian[ 2]);
    sum += weight * sampleTex.a;
    totalWeight += weight;;
    sampleTex = (texture2D(TextureBlurInput, (min(uv + axis * float(3) * 2.0, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio));
    z = decode24(sampleTex.xyz);
    weight = max(0.0, 1.0 - sharpnessFactor * abs(z - initialZ)) * (0.3 + gaussian[ 3]);
    sum += weight * sampleTex.a;
    totalWeight += weight;;
    aoDepth.a = sum / totalWeight;
    return aoDepth;
}
vec4 ssaoBlurV() {
    // vec4 color = texture2D(TextureInput, (min(gTexCoord, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio);
    // return vec4(color.rgb * ssaoBlur(vec2(0.0, 1.0) / uTextureBlurInputSize).aaa, color.a);

    vec4 color = texture2D(TextureInput, (min(gTexCoord, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio);
    float aoDepth = texture2D(TextureBlurInput, (min(gTexCoord, 1.0 - 1e+0 / uTextureBlurInputSize.xy)) * uTextureBlurInputRatio).a;
    // color = vec4(1.0);
    return vec4(color.rgb * aoDepth, color.a);

}
void main(void) {
    gTexCoord = gl_FragCoord.xy / uTextureOutputSize.xy;
    vec4 color = ssaoBlurV();
    gl_FragColor = color;
}
