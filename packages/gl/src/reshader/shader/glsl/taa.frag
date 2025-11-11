//DEPRECATED
//reference:
//https://www.gdcvault.com/play/1022970/Temporal-Reprojection-Anti-Aliasing-in
//https://github.com/playdeadgames/temporal
//https://github.com/Unity-Technologies/PostProcessing/blob/v2/PostProcessing/Shaders/Builtins/TemporalAntialiasing.shader
precision highp float;
uniform float uSSAARestart;
uniform float uTaaEnabled;
uniform float uClipAABBEnabled;
uniform mat4 projMatrix;
uniform mat4 uTaaCurrentFramePVLeft;
uniform mat4 uTaaInvViewMatrixLeft;
uniform mat4 uTaaLastFramePVLeft;
uniform sampler2D TextureDepth;
uniform sampler2D TextureInput;
uniform sampler2D TexturePrevious;
uniform vec2 uTextureDepthRatio;
uniform vec2 uTextureDepthSize;
uniform vec2 uTextureInputRatio;
uniform vec2 uTextureInputSize;
uniform vec2 uTextureOutputRatio;
uniform vec2 outputSize;
uniform vec2 uTexturePreviousRatio;
uniform vec2 uTexturePreviousSize;
uniform vec4 halton;
uniform vec4 outputFovInfo[2];
#define SHADER_NAME supersampleTaa

vec2 gTexCoord;
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
vec3 RGBMToRGB( const in vec4 rgba ) {
    const float maxRange = 8.0;
    return rgba.rgb * maxRange * rgba.a;
}
const mat3 LUVInverse = mat3( 6.0013, -2.700, -1.7995, -1.332, 3.1029, -5.7720, 0.3007, -1.088, 5.6268 );
vec3 LUVToRGB( const in vec4 vLogLuv ) {
    float Le = vLogLuv.z * 255.0 + vLogLuv.w;
    vec3 Xp_Y_XYZp;
    Xp_Y_XYZp.y = exp2((Le - 127.0) / 2.0);
    Xp_Y_XYZp.z = Xp_Y_XYZp.y / vLogLuv.y;
    Xp_Y_XYZp.x = vLogLuv.x * Xp_Y_XYZp.z;
    vec3 vRGB = LUVInverse * Xp_Y_XYZp;
    return max(vRGB, 0.0);
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
vec3 decodeRGBM(const in vec4 color, const in float range) {
    if(range <= 0.0) return color.rgb;
    return range * color.rgb * color.a;
}
float getLuminance(const in vec3 color) {
    const vec3 colorBright = vec3(0.2126, 0.7152, 0.0722);
    return dot(color, colorBright);
}
int decodeProfile(const in vec4 pack) {
    float packValue = floor(pack.b * 255.0 + 0.5);
    float profile = mod(packValue, 2.0);
    profile += mod(packValue - profile, 4.0);
    return int(profile);
}
float linearizeDepth(float depth) {
    highp mat4 projection = projMatrix;
    highp float z = depth * 2.0 - 1.0; // depth in clip space
    return -projection[3].z / (z + projection[2].z);
}
float decodeDepth(const in vec4 pack) {
    return pack.x;
}
float decodeAlpha(const in vec4 pack) {
    return pack.a;
}

vec3 reconstructWSPosition(const in vec2 uv, const in vec4 corners0, const in vec4 corners1, const in mat4 invView, const in float depth) {
    vec2 finalUv = uv;
    vec4 AB = mix(corners0, corners1, vec4(finalUv.x));
    vec3 vsPos = vec3(mix(AB.xy, AB.zw, vec2(finalUv.y)), 1.0) * depth;
    return (invView * vec4(vsPos, 1.0)).xyz;
}
vec3 closestFragment(in vec2 uv, const in vec2 texelSize) {
    // float d;
    // vec2 size = 2.0 * texelSize;
    // vec3 dmin = vec3(0.0, 0.0, 0.0);
    // dmin.z = decodeDepth( (texture2D(TextureDepth, (min(uv + vec2( 0.0, 0.0), 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)));;
    // d = decodeDepth( (texture2D(TextureDepth, (min(uv + vec2(  -size.x, size.y), 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)));;
    // if(d < dmin.z) dmin = vec3(  -size.x, size.y, d);;
    // d = decodeDepth( (texture2D(TextureDepth, (min(uv + vec2(  size.x, size.y), 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)));;
    // if(d < dmin.z) dmin = vec3(  size.x, size.y, d);;
    // d = decodeDepth( (texture2D(TextureDepth, (min(uv + vec2(  -size.x, -size.y), 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)));;
    // if(d < dmin.z) dmin = vec3(  -size.x, -size.y, d);;
    // d = decodeDepth( (texture2D(TextureDepth, (min(uv + vec2(  size.x, -size.y), 1.0 - 1e+0 / uTextureDepthSize.xy)) * uTextureDepthRatio)));;
    // if(d < dmin.z) dmin = vec3(  size.x, -size.y, d);;
    // return vec3(uv + dmin.xy, dmin.z);

    float depth = decodeDepth(texture2D(TextureDepth, (min(uv, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    return vec3(uv, depth);
}
vec4 clip_aabb_opti(const in vec4 minimum, const in vec4 maximum, const in vec4 color) {
    const float eps = 0.00000001;
    vec4 center = 0.5 * (maximum + minimum);
    vec4 extents = 0.5 * (maximum - minimum) + eps;
    vec4 offset = color - center;
    vec4 ts = abs(offset / extents);
    float t = max(max(ts.r, ts.g), max(ts.b, ts.a));
    return center + offset / max(1.0, t);
}

vec4 clip_aabb(const in vec2 texelSize, const in vec4 preColor, out vec4 m, bool sharpen) {
    vec2 uv = gTexCoord;
    vec4 tl = (texture2D(TextureInput, (min(uv + vec2(-texelSize.x, texelSize.y), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    vec4 t = (texture2D(TextureInput, (min(uv + vec2(0.0, texelSize.y), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    vec4 tr = (texture2D(TextureInput, (min(uv + vec2(texelSize.x, texelSize.y), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    vec4 ml = (texture2D(TextureInput, (min(uv + vec2(-texelSize.x, 0.0), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    vec4 mr = (texture2D(TextureInput, (min(uv + vec2(texelSize.x, 0.0), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    vec4 bl = (texture2D(TextureInput, (min(uv + vec2(-texelSize.x, -texelSize.y), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    vec4 b = (texture2D(TextureInput, (min(uv + vec2(0.0, -texelSize.y), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    vec4 br = (texture2D(TextureInput, (min(uv + vec2(texelSize.x, -texelSize.y), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    if (sharpen) {
        vec4 corners = 2.0 * (tr + bl + br + tl) - 2.0 * m;
        m += (m - (corners * 0.166667)) * 2.718282 * 0.3;
        m = max(vec4(0.0), m);
    }
    vec4 cmin5 = min(mr, min(m, min(ml, min(t, b))));
    vec4 cmin = min(cmin5, min(tl, min(tr, min(bl, br))));
    vec4 cmax5 = max(mr, max(m, max(ml, max(t, b))));
    vec4 cmax = max(cmax5, max(tl, max(tr, max(bl, br))));
    cmin = 0.5 * (cmin + cmin5);
    cmax = 0.5 * (cmax + cmax5);
    return clip_aabb_opti(cmin, cmax, preColor);
}

vec4 taa(const in vec2 ssVel, const in vec2 texelSize) {
    vec2 uv = gTexCoord;
    vec4 m = (texture2D(TextureInput, (min(uv, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    vec4 previousColor = (texture2D(TexturePrevious, (min(uv - ssVel, 1.0 - 1e+0 / uTexturePreviousSize.xy)) * uTexturePreviousRatio));
    previousColor = clip_aabb(texelSize, previousColor, m, true);
    float lum0 = getLuminance(m.rgb);
    float lum1 = getLuminance(previousColor.rgb);
    float diff = abs(lum0 - lum1) / max(lum0, max(lum1, 0.2));
    float unbiased_weight = 1.0 - diff;
    float feedback = mix(0.88, 0.97, unbiased_weight * unbiased_weight);
    return mix(m, previousColor, feedback);
}
vec2 computeSSVelocity(const in vec3 wsPos, const in mat4 currentFrameProjView, const in mat4 lastFrameProjView, const in bool rightEye) {
    vec4 ssCurrentPos = currentFrameProjView * vec4(wsPos, 1.0);
    vec4 ssPrevPos = lastFrameProjView * vec4(wsPos, 1.0);
    vec2 ndcCurrent = ssCurrentPos.xy / ssCurrentPos.w;
    vec2 ndcPrev = ssPrevPos.xy / ssPrevPos.w;
    if(ndcPrev.x >= 1.0 || ndcPrev.x <= -1.0 || ndcPrev.x >= 1.0 || ndcPrev.y <= -1.0)
    return vec2(0.0);
    return 0.5 * (ndcCurrent - ndcPrev);
}
vec4 supersample() {
    vec4 currFragColor = (texture2D(TextureInput, (min(gTexCoord, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).rgba;
    float haltz = abs(halton.z);
    if (haltz == 1.0) {
        return currFragColor;
    }
    vec4 accumColorN = (texture2D(TexturePrevious, (floor((min(gTexCoord, 1.0 - 1e+0 / uTexturePreviousSize.xy)) * uTexturePreviousSize) + 0.5) * uTexturePreviousRatio / uTexturePreviousSize, -99999.0)).rgba;
    if (uClipAABBEnabled == 1.0) {
        vec2 texelSize = vec2(1.0) / uTextureInputSize;
        accumColorN = clip_aabb(texelSize, accumColorN, currFragColor, false);
    }

    float lerpFac = 1.0 / halton.w;
    // if (halton.w == 1.0) lerpFac = uSSAARestart;
    // if (haltz == 3.0) {
    //     return mix(currFragColor, accumColorN, lerpFac);
    // }
    return mix(accumColorN, currFragColor, lerpFac);
}
vec4 computeTaa(const in mat4 invView, const in mat4 currentFrameProjView, const in mat4 lastFrameProjView, const in vec4 corners0, const in vec4 corners1) {
    vec2 uv = gTexCoord;
    float haltz = abs(halton.z);
    if (haltz == 1.0) {
        vec2 texelSize = vec2(1.0) / uTextureInputSize;
        vec3 closest = closestFragment(uv, texelSize);
        if (closest.z >= 1.0) {
            return  (texture2D(TextureInput, (min(uv - 0.5 * halton.xy * texelSize, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
        }
        float depth = linearizeDepth(closest.z);
        vec3 ws = reconstructWSPosition(closest.xy, corners0, corners1, invView, depth);
        vec2 ssVel = computeSSVelocity(ws, currentFrameProjView, lastFrameProjView, uv.x >= 0.5);
        return taa(ssVel, texelSize);
    }
    return supersample();
}
vec4 supersampleTaa() {
    if (uTaaEnabled == 0.0) {
        return supersample();
    }
    return computeTaa(uTaaInvViewMatrixLeft, uTaaCurrentFramePVLeft, uTaaLastFramePVLeft, outputFovInfo[0], outputFovInfo[1]);
}
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    vec4 color = supersampleTaa();
    gl_FragColor = color;
}
