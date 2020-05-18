precision mediump float;
#define SHADER_NAME SSAO_BLUR

struct MaterialParams {
    //-cameraFar / 0.0625f
    float farPlaneOverEdgeDistance;
    vec2 axis;
    vec2 resolution;
};

uniform sampler2D materialParams_ssao;
uniform sampler2D TextureInput;
uniform MaterialParams materialParams;

varying vec2 vTexCoord;


const int kGaussianCount = 4;
float kGaussianSamples[8];

void initKernels() {
    kGaussianSamples[0] = 0.199471;
    kGaussianSamples[1] = 0.176033;
    kGaussianSamples[2] = 0.120985;
    kGaussianSamples[3] = 0.064759;
    kGaussianSamples[4] = 0.026995;
    kGaussianSamples[5] = 0.008764;
    kGaussianSamples[6] = 0.002216;
    kGaussianSamples[7] = 0.000436;
}

float unpack(vec2 depth) {
    // this is equivalent to (x8 * 256 + y8) / 65535, which gives a value between 0 and 1
    return (depth.x * (256.0 / 257.0) + depth.y * (1.0 / 257.0));
}

float bilateralWeight(in float depth, in float sampleDepth) {
    float diff = (sampleDepth - depth) * materialParams.farPlaneOverEdgeDistance;
    return max(0.0, 1.0 - diff * diff);
}

void tap(inout float sum, inout float totalWeight, float weight, float depth, vec2 position) {
    // ambient occlusion sample
    vec3 data = texture2D(materialParams_ssao, position).rgb;

    // bilateral sample
    float bilateral = bilateralWeight(depth, unpack(data.gb));
    bilateral *= weight;
    sum += data.r * bilateral;
    totalWeight += bilateral;
}

void main() {
    initKernels();
    highp vec2 uv = vTexCoord; // interpolated at pixel's center

    vec3 data = texture2D(materialParams_ssao, uv).rgb;
    if (data.g * data.b == 1.0) {
        // This is the skybox, skip
        if (materialParams.axis.y > 0.0) {
            vec4 color = texture2D(TextureInput, uv);
            gl_FragColor = color;
        } else {
            gl_FragColor = vec4(data, 1.0);
        }
        return;
    }

    // we handle the center pixel separately because it doesn't participate in
    // bilateral filtering
    float depth = unpack(data.gb);
    float totalWeight = kGaussianSamples[0];
    float sum = data.r * totalWeight;

    vec2 axis = materialParams.axis / materialParams.resolution;
    vec2 offset = axis;
    for (int i = 1; i < kGaussianCount; i++) {
        float weight = kGaussianSamples[i];
        tap(sum, totalWeight, weight, depth, uv + offset);
        tap(sum, totalWeight, weight, depth, uv - offset);
        offset += axis;
    }

    float occlusion = sum * (1.0 / totalWeight);
    vec2 gb = data.gb;

    if (materialParams.axis.y > 0.0) {
        vec4 color = texture2D(TextureInput, uv);
        gl_FragColor = vec4(color.rgb * occlusion, color.a);;
    } else {
        gl_FragColor = vec4(occlusion, gb, 1.0);
    }
}
