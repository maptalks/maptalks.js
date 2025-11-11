

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
    highp vec4 resolution; //viewport width, height, 1/width, 1/height
    // camera
    highp vec3 cameraPosition;
    // time
    highp float time;// time in seconds, with a 1 second period
    // directional light
    mediump vec4 lightColorIntensity;
    mediump vec4 sun; // cos(sunAngle), sin(sunAngle), 1/(sunAngle*HALO_SIZE-sunAngle), HALO_EXP
    highp vec3 lightDirection;
    // int fParamsX,
    // shadow
    mediump vec3 shadowBias;
    // oneOverFroxelDimensionY,
    // froxels
    // zParams,
    // fParams,
    // origin,
    // froxels (again, for alignment purposes)
    // oneOverFroxelDimension,
    // ibl
    mediump float iblLuminance; //TODO 干嘛的？
    // camera
    mediump float exposure; //TODO
    mediump float ev100; //TODO
    // ibl
    highp vec3 iblSH[9];
    mediump vec2 iblMaxMipLevel;
    // user time
    // vec4 userTime,
};

FrameUniforms frameUniforms;

uniform highp vec4 resolution;
uniform highp vec3 cameraPosition;
uniform highp float time;
uniform mediump vec4 lightColorIntensity;
uniform mediump vec4 sun;
uniform highp vec3 lightDirection;
uniform mediump float exposure;
uniform mediump float ev100;
uniform mediump float iblLuminance;
#if defined(HAS_IBL_LIGHTING)
    uniform highp vec3 iblSH[9];
    uniform mediump vec2 iblMaxMipLevel;
#endif

void initFrameUniforms() {
    frameUniforms.resolution = resolution;
    frameUniforms.cameraPosition = cameraPosition;
    frameUniforms.time = time;
    frameUniforms.lightColorIntensity = lightColorIntensity * vec4(1.0, 1.0, 1.0, exposure);
    frameUniforms.lightDirection = normalize(lightDirection);
    frameUniforms.sun = sun;
    frameUniforms.exposure = exposure;
    frameUniforms.ev100 = ev100;
    frameUniforms.iblLuminance = iblLuminance * exposure;

#if defined(HAS_IBL_LIGHTING)
    frameUniforms.iblMaxMipLevel = iblMaxMipLevel;
    for (int i = 0; i < 9; i++)
    {
        frameUniforms.iblSH[i] = iblSH[i];
    }
#endif
    // frameUniforms.iblSH = iblSH;
    frameUniforms.shadowBias = vec3(0.0, 0.0, 0.0);
}
