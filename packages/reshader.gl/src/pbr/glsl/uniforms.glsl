

struct FrameUniforms {
    // transforms
    // mat4 viewFromWorldMatrix, //viewMatrix
    // mat4 worldFromViewMatrix,
    // mat4 clipFromViewMatrix,
    // mat4 viewFromClipMatrix,
    // mat4 clipFromWorldMatrix,
    // mat4 worldFromClipMatrix,
    // mat4 lightFromWorldMatrix,
    // view
    vec4 resolution, //viewport width, height, 1/width, 1/height
    // camera
    vec3 cameraPosition,
    // time
    float time,// time in seconds, with a 1 second period
    // directional light
    vec4 lightColorIntensity,
    vec4 sun, // cos(sunAngle), sin(sunAngle), 1/(sunAngle*HALO_SIZE-sunAngle), HALO_EXP
    vec3 lightDirection,
    // int fParamsX,
    // shadow
    vec3 shadowBias;
    // oneOverFroxelDimensionY,
    // froxels
    // zParams,
    // fParams,
    // origin,
    // froxels (again, for alignment purposes)
    // oneOverFroxelDimension,
    // ibl
    float iblLuminance, //TODO 干嘛的？
    // camera
    float exposure, //TODO
    float ev100, //TODO
    // ibl
    vec3 iblSH[9],
    // user time
    // vec4 userTime,
};

FrameUniforms frameUniforms;

uniform vec4 resolution;
uniform vec3 cameraPosition;
uniform float time;
uniform vec4 lightColorIntensity;
uniform vec4 sun;
uniform vec3 lightDirection;
uniform float iblLuminance;
uniform float exposure;
uniform float ev100;
uniform vec3 iblSH[9];

void initFrameUniforms() {
    frameUniforms.resolution = resolution;
    frameUniforms.cameraPosition = cameraPosition;
    frameUniforms.time = time;
    frameUniforms.lightColorIntensity = lightColorIntensity;
    frameUniforms.sun = sun;
    frameUniforms.lightDirection = lightDirection;
    frameUniforms.iblLuminance = iblLuminance;
    frameUniforms.exposure = exposure;
    frameUniforms.ev100 = ev100;
    frameUniforms.iblSH = iblSH;
    frameUniforms.shadowBias = [0, 0, 0];
}
