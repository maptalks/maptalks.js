#if __VERSION__ == 100
    #if defined(GL_OES_standard_derivatives)
        #extension GL_OES_standard_derivatives : enable
    #endif
#endif

precision highp float;

#include <gl2_frag>

varying vec2 vTexCoord;

#define saturate(x)        clamp(x, 0.0, 1.0)
#define SHADER_NAME SSAO_EXTRACT
#define PI 3.14159265359

const float kEdgeDistance = 0.0625; // this shouldn't be hardcoded

struct MaterialParams {
    //width, height, 1 / width, 1 / height
    mat4 projMatrix;
    mat4 invProjMatrix;
    vec4 resolution;
    float radius;
    //options.bias
    float bias;
    //options.power
    float power;
    //1 / -cameraFar
    // float invFarPlane;
    vec2 cameraNearFar;
};

uniform MaterialParams materialParams;
uniform sampler2D materialParams_depth;

#define NOISE_NONE      0
#define NOISE_PATTERN   1
#define NOISE_RANDOM    2
#define NOISE_TYPE      NOISE_PATTERN

const int kSphereSampleCount = 16;
uniform vec3 kSphereSamples[16];

// const int kNoiseSampleCount = 16;
// uniform vec3 kNoiseSamples[16];

vec3 getNoiseSample(const int x) {
    if (x == 0) {
        return vec3(-0.078247, -0.749924, -0.656880);
    } else if (x == 1) {
        return vec3(-0.572319, -0.102379, -0.813615);
    } else if (x == 2) {
        return vec3( 0.048653, -0.380791,  0.923380);
    } else if (x == 3) {
        return vec3( 0.281202, -0.656664, -0.699799);
    } else if (x == 4) {
        return vec3( 0.711911, -0.235841, -0.661485);
    } else if (x == 5) {
        return vec3(-0.445893,  0.611063,  0.654050);
    } else if (x == 6) {
        return vec3(-0.703598,  0.674837,  0.222587);
    } else if (x == 7) {
        return vec3( 0.768236,  0.507457,  0.390257);
    } else if (x == 8) {
        return vec3(-0.670286, -0.470387,  0.573980);
    } else if (x == 9) {
        return vec3( 0.199235,  0.849336, -0.488808);
    } else if (x == 10) {
         return vec3(-0.768068, -0.583633, -0.263520);
     } else if (x == 11) {
         return vec3(-0.897330,  0.328853,  0.294372);
     } else if (x == 12) {
         return vec3(-0.570930, -0.531056, -0.626114);
     } else if (x == 13) {
         return vec3( 0.699014,  0.063283, -0.712303);
     } else if (x == 14) {
         return vec3( 0.207495,  0.976129, -0.064172);
     } else if (x == 15) {
         return vec3(-0.060901, -0.869738, -0.489742);
     } else {
        return vec3(0.0);
     }
}

vec2 pack(highp float depth) {
    // we need 16-bits of precision
    highp float z = clamp(depth * 1.0 / -materialParams.cameraNearFar.y, 0.0, 1.0);
    highp float t = floor(256.0 * z);
    mediump float hi = t * (1.0 / 256.0);   // we only need 8-bits of precision
    mediump float lo = (256.0 * z) - t;     // we only need 8-bits of precision
    return vec2(hi, lo);
}

// random number between 0 and 1
float random(highp vec2 n) {
    n  = fract(n * vec2(5.3987, 5.4421));
    n += dot(n.yx, n.xy + vec2(21.5351, 14.3137));
    highp float xy = n.x * n.y;
    // compute in [0..2[ and remap to [0.0..1.0[
    return fract(xy * 95.4307) + fract(xy * 75.04961) * 0.5;
}

// noise vector between -1 and 1
vec3 getNoise(const vec2 uv) {
    #if NOISE_TYPE == NOISE_RANDOM
        return normalize(2.0 * vec3(random(uv), random(uv * 2.0), random(uv * 4.0)) - vec3(1.0));
    #elif NOISE_TYPE == NOISE_PATTERN
        // uint ix = uint(gl_FragCoord.x) & 3u;
        // uint iy = uint(gl_FragCoord.y) & 3u;
        // return kNoiseSamples[ix + iy * 4u];
        vec2 xy = floor(gl_FragCoord.xy);
        float ix = mod(xy.x, 4.0);
        float iy = mod(xy.y, 4.0);
        return getNoiseSample(int(ix + iy * 4.0));
    #else
        return vec3(0.0);
    #endif
}

highp mat4 getClipFromViewMatrix() {
    return materialParams.projMatrix;
}

highp mat4 getViewFromClipMatrix() {
    return materialParams.invProjMatrix;
}

// highp float linearizeDepth(highp float depth) {
//     highp float z = depth * 2.0 - 1.0; // depth in clip space
//     highp float cameraNear = materialParams.cameraNearFar.x;
//     highp float cameraFar = materialParams.cameraNearFar.y;
//     return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
// }

highp float fetchDepth(const vec2 uv) {
    return texture2D(materialParams_depth, uv).r;
}

// highp float sampleDepthLinear(const vec2 uv) {
//     return linearizeDepth(fetchDepth(uv));
// }

highp float projectDepth(highp float depth) {
    highp mat4 projection = getClipFromViewMatrix();
    highp float z = depth * 2.0 - 1.0; // depth in clip space
    return -projection[3].z / (z + projection[2].z);
}

highp float sampleProjDepth(const vec2 uv) {
    return projectDepth(texture2D(materialParams_depth, uv).r);
}

highp vec3 computeViewSpacePositionFromDepth(in vec2 p, highp float linearDepth) {
    p = p * 2.0 - 1.0; // to clip space
    highp mat4 invProjection = getViewFromClipMatrix();
    p.x *= invProjection[0].x;
    p.y *= invProjection[1].y;
    return vec3(p * -linearDepth, linearDepth);

    // return vec3((0.5 - uv) * materialParams.positionParams.xy * linearDepth, linearDepth);
}

// compute normals using derivatives, which essentially results in half-resolution normals
// this creates arifacts around geometry edges
highp vec3 computeViewSpaceNormalNotNormalized(const highp vec3 position) {
    highp vec3 dpdx = dFdx(position);
    highp vec3 dpdy = dFdy(position);
    return cross(dpdx, dpdy);
}

// compute normals directly from the depth texture, resulting in full resolution normals
highp vec3 computeViewSpaceNormalNotNormalized(const highp vec3 position, const vec2 uv) {
    vec2 uvdx = uv + vec2(materialParams.resolution.z, 0.0);
    vec2 uvdy = uv + vec2(0.0, materialParams.resolution.w);
    highp vec3 px = computeViewSpacePositionFromDepth(uvdx, sampleProjDepth(uvdx));
    highp vec3 py = computeViewSpacePositionFromDepth(uvdy, sampleProjDepth(uvdy));
    highp vec3 dpdx = px - position;
    highp vec3 dpdy = py - position;
    return cross(dpdx, dpdy);
}

// Ambient Occlusion, largely inspired from:
// Hemisphere Crysis-style SSAO. See "Screen Space Ambient Occlusion" by John Chapman

float computeAmbientOcclusionSSAO(const highp vec3 origin, const highp float originDepth, mat3 TBN, const vec3 normal, const vec3 sphereSample) {
    highp mat4 projection = getClipFromViewMatrix();
    float radius0 = materialParams.radius;
    float bias0 = materialParams.bias;

    // vec3 r = sphereSample * radius0;
    // r = reflect(r, noise);
    // r = sign(dot(r, normal)) * r;
    // highp vec3 samplePos = origin + r;

    // highp vec4 samplePosScreen = projection * vec4(samplePos, 1.0);
    // samplePosScreen.xy = samplePosScreen.xy * (0.5 / samplePosScreen.w) + 0.5;

    // highp float occlusionDepth = sampleDepthLinear(samplePosScreen.xy);

    // // float t = saturate(radius0 / abs(originDepth - occlusionDepth));
    // // float rangeCheck = t * t * (3.0 - 2.0 * t);
    // float rangeCheck = abs(originDepth - occlusionDepth) < radius0 ? 1.0 : 0.0;
    // float d = originDepth - occlusionDepth; // distance from depth to sample
    // return (d <= bias0 ? 0.0 : rangeCheck);

    //--------------------------
    // 改用view坐标来计算ao
    highp vec3 samplePos = TBN * sphereSample;
    // fuzhenn/maptalks-studio#1126
    // dot是为了忽略射入surface方向的射线的干扰，否则会出现acne
    // https://www.gamedev.net/forums/topic/556666-ssao-implementation-problem/4575637/
    float dir = dot(samplePos, normal);
    samplePos = sign(dir) * samplePos;
    samplePos = origin + samplePos * radius0;

    highp vec4 samplePosScreen = projection * vec4(samplePos, 1.0);
    samplePosScreen.xy = samplePosScreen.xy * (0.5 / samplePosScreen.w) + 0.5;

    highp float occlusionDepth = fetchDepth(samplePosScreen.xy);
    occlusionDepth = projectDepth(occlusionDepth);

    float t = saturate(radius0 / abs(originDepth - occlusionDepth));
    float rangeCheck = t * t * (3.0 - 2.0 * t);
    // float rangeCheck = abs(originDepth - occlusionDepth) < radius0 ? 1.0 : 0.0;

    return (occlusionDepth >= samplePos.z + bias0 ? rangeCheck : 0.0);
}

void main() {

    highp vec2 uv = vTexCoord; // interpolated to pixel center

    highp float depth = fetchDepth(uv);
    highp float prjDepth = projectDepth(depth);
    highp vec3 origin = computeViewSpacePositionFromDepth(uv, prjDepth);
    highp vec3 normal = computeViewSpaceNormalNotNormalized(origin, uv);
    // highp float linearDepth = linearizeDepth(depth);

    normal = normalize(normal);
    vec3 noise = getNoise(uv);

    // https://learnopengl.com/Advanced-Lighting/SSAO
    vec3 randomVec = noise.xyz;
    vec3 tangent   = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN       = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for (int i = 0; i < kSphereSampleCount; i++) {
        occlusion += computeAmbientOcclusionSSAO(origin, prjDepth, TBN, normal, kSphereSamples[i]);
    }

    float ao = 1.0 - occlusion / float(kSphereSampleCount);
    // simulate user-controled ao^n with n[1, 2]
    ao = mix(ao, ao * ao, materialParams.power);

    // vec2 coords = floor(gl_FragCoord.xy);
    // ao += (1.0 - step(kEdgeDistance, abs(dFdx(origin.z)))) * dFdx(ao) * (0.5 - mod(coords.x, 2.0));
    // ao += (1.0 - step(kEdgeDistance, abs(dFdy(origin.z)))) * dFdy(ao) * (0.5 - mod(coords.y, 2.0));
    glFragColor = vec4(ao, pack(origin.z), 1.0);
    // glFragColor = vec4(vec3(ao), 1.0);

    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
