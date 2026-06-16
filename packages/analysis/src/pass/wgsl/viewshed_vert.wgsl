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

struct ShaderUniforms {
    viewshed_projViewMatrixFromViewpoint: mat4x4f,
}

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location($o) viewpoint: vec4f,
};


struct VertexInput {
    @location($i) aPosition: vec3f,
    @location($i) aTexCoord: vec2f,
};

#ifdef HAS_MASK_EXTENT
@group(0) @binding($b) var<uniform> matrixUniforms: MatrixUniforms;
#endif
@group(0) @binding($b) var<uniform> uniforms: TerrainUniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;
@group(0) @binding($b) var flatMaskSampler: sampler;
@group(0) @binding($b) var flatMask: texture_2d<f32>;

// 主顶点着色器函数
@vertex
fn main(
    vertexInput: VertexInput,
    // 假设 vertexOutput 结构体参数来自其它部分
) -> VertexOutput {
    var output: VertexOutput;

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
        output.position = matrixUniforms.projMatrix * getMaskPosition(position, uniforms.modelMatrix, output);
    #else
        output.position = uniforms.projViewModelMatrix * position;
    #endif

    output.viewpoint = shaderUniforms.viewshed_projViewMatrixFromViewpoint * uniforms.modelMatrix * position;

    return output;
}

#else
#include <get_output>

// Uniform 结构体
struct Uniforms {
    modelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
    projViewModelMatrix: mat4x4f,
};

struct ShaderUniforms {
    viewshed_projViewMatrixFromViewpoint: mat4x4f,
}

@group(0) @binding($b) var<uniform> uniforms: Uniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;

struct VertexInput {
    #include <position_vert>
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) viewpoint: vec4f,
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let localPositionMatrix: mat4x4f = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);
    let localPosition: vec4f = localPositionMatrix * getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);

    output.viewpoint = shaderUniforms.viewshed_projViewMatrixFromViewpoint * uniforms.modelMatrix * localPosition;
    output.position = uniforms.projViewModelMatrix * localPosition;

    return output;
}
#endif
