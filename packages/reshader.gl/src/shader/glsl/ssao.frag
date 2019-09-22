//Apache 2.0 License
//https://github.com/google/filament/

#define NOISE_NONE      0
#define NOISE_PATTERN   1
#define NOISE_RANDOM    2
#define NOISE_TYPE      NOISE_RANDOM

const int kSphereSampleCount = 16;
// vec3 kSphereSamples[16];

const int kNoiseSampleCount = 16;
// vec3 kNoiseSamples[16];

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
        int ix = int(gl_FragCoord.x);
        int iy = int(gl_FragCoord.y);
        return kNoiseSamples[ix + iy * 4];
    #else
        return vec3(0.0);
    #endif
}

highp float linearizeDepth(highp float depth) {
    highp mat4 projection = getClipFromViewMatrix();
    highp float z = depth * 2.0 - 1.0; // depth in clip space
    return -projection[3].z / (z + projection[2].z);
}


highp float sampleDepthLinear(const vec2 uv) {
    return linearizeDepth(readDepth(uv));
}

highp vec3 computeViewSpacePositionFromDepth(in vec2 p, highp float linearDepth) {
    p = p * 2.0 - 1.0; // to clip space
    highp mat4 invProjection = getViewFromClipMatrix();
    p.x *= invProjection[0].x;
    p.y *= invProjection[1].y;
    return vec3(p * -linearDepth, linearDepth);
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
    highp vec3 px = computeViewSpacePositionFromDepth(uvdx, sampleDepthLinear(uvdx));
    highp vec3 py = computeViewSpacePositionFromDepth(uvdy, sampleDepthLinear(uvdy));
    highp vec3 dpdx = px - position;
    highp vec3 dpdy = py - position;
    return cross(dpdx, dpdy);
}

// Ambient Occlusion, largely inspired from:
// Hemisphere Crysis-style SSAO. See "Screen Space Ambient Occlusion" by John Chapman

float computeAmbientOcclusionSSAO(const highp vec3 origin, const vec3 normal, const vec3 noise, const vec3 sphereSample) {
    highp mat4 projection = getClipFromViewMatrix();
    float radius = materialParams.radius;
    float bias = materialParams.bias;

    vec3 r = sphereSample * radius;
    r = reflect(r, noise);
    r = sign(dot(r, normal)) * r;
    highp vec3 samplePos = origin + r;

    highp vec4 samplePosScreen = projection * vec4(samplePos, 1.0);
    samplePosScreen.xy = samplePosScreen.xy * (0.5 / samplePosScreen.w) + 0.5;

    highp float occlusionDepth = sampleDepthLinear(samplePosScreen.xy);

    // smoothstep() optimized for range 0 to 1
    float t = saturate(radius / abs(origin.z - occlusionDepth));
    float rangeCheck = t * t * (3.0 - 2.0 * t);
    float d = samplePos.z - occlusionDepth; // distance from depth to sample
    return (d >= -bias ? 0.0 : rangeCheck);
}

void material(inout MaterialInputs material) {
    prepareMaterial(material);

    vec2 uv = variable_vertex.xy; // interpolated to pixel center

    highp float depth = sampleDepthLinear(uv);
    highp vec3 origin = computeViewSpacePositionFromDepth(uv, depth);
    highp vec3 normal = computeViewSpaceNormalNotNormalized(origin, uv);

    normal = normalize(normal);
    vec3 noise = getNoise(uv);

    float occlusion = 0.0;
    for (int i = 0; i < kSphereSampleCount; i++) {
        occlusion += computeAmbientOcclusionSSAO(origin, normal, noise, kSphereSamples[i]);
    }

    float ao = 1.0 - occlusion / float(kSphereSampleCount);
    // simulate user-controled ao^n with n[1, 2]
    ao = mix(ao, ao * ao, materialParams.power);

    material.baseColor.r = ao;
}
