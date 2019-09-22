#extension GL_OES_standard_derivatives : enable
#define saturate(x)        clamp(x, 0.0, 1.0)

precision mediump float;

varying vec2 vTexCoord;

uniform vec2 resolution;
uniform mat4 projMatrix;
uniform mat4 invProjMatrix;
uniform sampler2D materialParams_depth;
// uniform float cameraNear;
// uniform float cameraFar;
uniform float bias;
uniform float radius;
uniform float power;
//initialized in SSAOShader
uniform vec3 kSphereSamples[16];
uniform vec3 kNoiseSamples[16];

vec2 variable_vertex;
mat4 getClipFromViewMatrix() {
    return projMatrix;
}

mat4 getViewFromClipMatrix() {
    return invProjMatrix;
}

struct MaterialInputs {
    vec2 baseColor;
};

struct MaterialParams {
    vec4 resolution;
    float radius;
    float bias;
    float power;
} materialParams;

void prepareMaterial(MaterialInputs material) {
}

highp float readDepth(vec2 uv) {
    // float near = cameraNear;
    // float far = cameraFar;
    // float invClipZ = texture2D(materialParams_depth, uv).x;
    // return ( near * far ) / ( ( far - near ) * invClipZ - far );
    return texture2D(materialParams_depth, uv).x;
    // float cameraFarPlusNear = cameraFar + cameraNear;
    // float cameraFarMinusNear = cameraFar - cameraNear;
    // float cameraCoef = 2.0 * cameraNear;
    // return cameraCoef / (cameraFarPlusNear - texture2D(materialParams_depth, uv).x * cameraFarMinusNear);
    // return texture2D(materialParams_depth, uv).x;
}

#include <ssao_frag>

void main() {
    materialParams.resolution = vec4(0.0, 0.0, 1.0 / resolution);
    materialParams.radius = radius;
    materialParams.bias = bias;
    materialParams.power = power;

    MaterialInputs materialInputs;
    variable_vertex = vTexCoord;

    material(materialInputs);
    gl_FragColor = vec4(vec3(materialInputs.baseColor.r), 1.0);
    // gl_FragColor = texture2D(materialParams_depth, vTexCoord);
}
