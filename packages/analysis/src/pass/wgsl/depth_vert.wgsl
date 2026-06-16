#if IS_TERRAIN

#include <common_pack_float>
#include <mask_vert>

#ifdef HAS_MASK_EXTENT
struct MatrixUniforms {
    projMatrix: mat4x4f
};
#endif


// Uniform结构体定义
struct TerrainUniforms {
    minAltitude: f32,
    projViewModelMatrix: mat4x4f,
    modelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
};

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location($o) vHighPrecisionZW: vec2f,
};


struct VertexInput {
    @location($i) aPosition: vec3f,
    @location($i) aTexCoord: vec2f,
};

#ifdef HAS_MASK_EXTENT
@group(0) @binding($b) var<uniform> matrixUniforms: MatrixUniforms;
#endif
@group(0) @binding($b) var<uniform> uniforms: TerrainUniforms;
@group(0) @binding($b) var flatMaskSampler: sampler;
@group(0) @binding($b) var flatMask: texture_2d<f32>;

// 主顶点着色器函数
@vertex
fn main(
    vertexInput: VertexInput,
    // 假设 vertexOutput 结构体参数来自其它部分
) -> VertexOutput {
    var vertexOutput: VertexOutput;

    var uv: vec2f = vertexInput.aTexCoord;

    let encodedHeight: vec4f = textureSampleLevel(flatMask, flatMaskSampler, uv, 0.0);
    var altitude: f32 = vertexInput.aPosition.z;

    if (length(encodedHeight) < 2.0) {
        let maskHeight: f32 = decodeFloat32(encodedHeight);
        altitude = min(vertexInput.aPosition.z, maskHeight);
    }

    var position: vec4f = vec4f(vertexInput.aPosition.xy, (altitude + uniforms.minAltitude), 1.0);

    position = uniforms.positionMatrix * position;

    #ifdef HAS_MASK_EXTENT
        vertexOutput.position = matrixUniforms.projMatrix * getMaskPosition(position, uniforms.modelMatrix, vertexOutput);
    #else
        vertexOutput.position = uniforms.projViewModelMatrix * position;
    #endif

    vertexOutput.vHighPrecisionZW = vertexOutput.position.zw;

    return vertexOutput;
}

#else

#include <get_output>

// Uniform 结构体
struct Uniforms {
    projViewModelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;

// 顶点输入结构体
struct VertexInput {
#ifdef HAS_ALTITUDE
    @location($i) aPosition: vec2f,
    @location($i) aAltitude: f32,
#else
    #include <position_vert>
#endif
};
// 顶点输出结构体
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) vHighPrecisionZW: vec2f,
};

#ifdef HAS_ALTITUDE
fn unpackVTPosition(vertexInput: VertexInput) -> vec3f {
    return vec3f(vertexInput.aPosition, vertexInput.aAltitude);
}
#endif

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    #ifdef HAS_ALTITUDE
        let i: vec3f = unpackVTPosition(vertexInput);
        let j: vec4f = vec4f(i, 1.0);
        output.position = uniforms.projViewModelMatrix * j;
    #else
        let localPositionMatrix: mat4x4f = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);
        output.position = uniforms.projViewModelMatrix * localPositionMatrix * getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);
    #endif

    output.vHighPrecisionZW = output.position.zw;

    return output;
}

#endif
