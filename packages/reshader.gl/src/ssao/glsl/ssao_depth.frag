#version 100
precision highp float;
uniform int uFirstDepth;
uniform sampler2D TextureDepth;
uniform vec2 uTextureDepthRatio;
uniform vec2 uTextureDepthSize;
uniform vec2 uTextureOutputRatio;
uniform vec2 uTextureOutputSize;
uniform mat4 projMatrix;
uniform vec2 uNearFar;
#define SHADER_NAME Depth_MIPMAP

vec2 gTexCoord;

float linearizeDepth(float d) {
    // float near = uNearFar.x;
    // float far = uNearFar.y;
    // float z = d * 2.0 - 1.0;
    // float depth = (2.0 * near * far) / (far + near - z * (far - near));
    // return (depth - near) / (far - near);

    // float z = depth * 2.0 - 1.0; // depth in clip space
    // return -projMatrix[3].z / (z + projMatrix[2].z);

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
vec4 depthMipmap() {
    vec2 invSize = 1.0 / uTextureDepthSize;
    vec4 depths;
    vec2 offDepth = vec2(0.25, -0.25);
    if (uFirstDepth == 1) {
        depths.x = decodeDepth( (texture2D(TextureDepth, (min(gTexCoord + offDepth.yy * invSize, 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)));
        depths.y = decodeDepth( (texture2D(TextureDepth, (min(gTexCoord + offDepth.xy * invSize, 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)));
        depths.z = decodeDepth( (texture2D(TextureDepth, (min(gTexCoord + offDepth.yx * invSize, 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)));
        depths.w = decodeDepth( (texture2D(TextureDepth, (min(gTexCoord + offDepth.xx * invSize, 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)));
    }
    else {
        depths.x = decode24( (texture2D(TextureDepth, (min(gTexCoord + offDepth.yy * invSize, 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)).xyz);
        depths.y = decode24( (texture2D(TextureDepth, (min(gTexCoord + offDepth.xy * invSize, 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)).xyz);
        depths.z = decode24( (texture2D(TextureDepth, (min(gTexCoord + offDepth.yx * invSize, 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)).xyz);
        depths.w = decode24( (texture2D(TextureDepth, (min(gTexCoord + offDepth.xx * invSize, 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)).xyz);
    }
    return vec4(encode24(min(min(depths.x, depths.y), min(depths.z, depths.w))), 1.0);
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / uTextureOutputSize.xy;
    vec4 color = depthMipmap();
    gl_FragColor = color;
}
