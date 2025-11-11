//2020-05-18
//此版本是基于filament中已删除的ssao.mat版本开发的，已经替换为filament@1.5的sao.mat版本precision mediump float;

varying vec2 vTexCoord;

uniform vec2 axis;
uniform vec2 outputSize;
uniform mat4 projMatrix;

uniform sampler2D materialParams_ssao;
uniform sampler2D materialParams_depth;
uniform sampler2D TextureInput;

mat4 getClipFromViewMatrix() {
    return projMatrix;
}
//Apache 2.0 License
//https://github.com/google/filament/

// z-distance (in m) that constitute an edge for bilateral filtering
#define EDGE_DISTANCE   0.1

const int kGaussianCount = 5;
const int kRadius = kGaussianCount - 1;
float kGaussianSamples[5];
const float kGaussianWeightSum = 0.993872;

vec2 clampToEdge(const sampler2D s, vec2 uv) {
    vec2 size = outputSize;
    return clamp(uv, vec2(0), size - vec2(1));
}

float linearizeDepthDifference(float d0, float d1) {
    mat4 projection = getClipFromViewMatrix();
    float A = -projection[3].z;
    float B =  projection[2].z;
    float K = (2.0 * A) / (d0 * 2.0 + (B - 1.0)); // actually a constant for this fragment
    float d = K * (d0 - d1) / (d1 * 2.0 + (B - 1.0));
    return d;
}

float bilateralWeight(const vec2 p, in float depth) {
    float sampleDepth = texture2D(materialParams_depth, p).r;
    float ddepth = linearizeDepthDifference(depth, sampleDepth);
    float diff = (1.0 / EDGE_DISTANCE) * ddepth;
    return max(0.0, 1.0 - diff * diff);
}

void tap(inout float sum, inout float totalWeight, float weight, float depth, vec2 position) {
    position = clampToEdge(materialParams_ssao, position);
    vec2 uv = position / outputSize;
    // ambient occlusion sample
    float ao = texture2D(materialParams_ssao, uv).r;
    // bilateral sample
    float bilateral = bilateralWeight(uv, depth);
    bilateral *= weight;
    sum += ao * bilateral;
    totalWeight += bilateral;
}

void initKernels() {
    kGaussianSamples[0] = 0.239365;
    kGaussianSamples[1] = 0.199935;
    kGaussianSamples[2] = 0.116512;
    kGaussianSamples[3] = 0.0473701;
    kGaussianSamples[4] = 0.0134367;
}

void main() {
    initKernels();
    vec2 uv = vTexCoord.xy * outputSize.xy;

    float depth = texture2D(materialParams_depth, vTexCoord).r;

    // we handle the center pixel separately because it doesn't participate in
    // bilateral filtering
    float totalWeight = kGaussianSamples[0];
    float sum = texture2D(materialParams_ssao, vTexCoord).r * totalWeight;

    for (int i = 1; i <= kRadius; i++) {
        float weight = kGaussianSamples[i];
        vec2 offset = float(i) * axis;
        tap(sum, totalWeight, weight, depth, uv + offset);
        tap(sum, totalWeight, weight, depth, uv - offset);
    }

    float occlusion = sum * (1.0 / totalWeight);

    if (axis.y == 1.0) {
        vec4 color = texture2D(TextureInput, vTexCoord);
        gl_FragColor = vec4(color.rgb * occlusion, color.a);
    } else {
        gl_FragColor = vec4(occlusion);
    }
}
