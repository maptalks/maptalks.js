// 假设 common_pack_float.wgsl 和 mask_vert.wgsl 文件存在
#include <common_pack_float>
#include <mask_vert>

// 假设 vsm_shadow_vert.wgsl 文件存在
#if HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_vert>
#endif

struct MatrixUniforms {
    projMatrix: mat4x4f,
    heightScale: f32,
};


// Uniform结构体定义
struct TerrainUniforms {
    minAltitude: f32,
    projViewModelMatrix: mat4x4f,
    modelMatrix: mat4x4f,
    modelViewMatrix: mat4x4f,
    positionMatrix: mat4x4f,
};

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location($o) vUv: vec2f,
};


struct VertexInput {
    @location($i) aPosition: vec3f,
    @location($i) aTexCoord: vec2f,
};

@group(0) @binding($b) var<uniform> matrixUniforms: MatrixUniforms;
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

    var position: vec4f = vec4f(vertexInput.aPosition.xy, (altitude + uniforms.minAltitude) * matrixUniforms.heightScale, 1.0);
    position = uniforms.positionMatrix * position;

    #ifdef HAS_MASK_EXTENT
        vertexOutput.position = matrixUniforms.projMatrix * getMaskPosition(position, uniforms.modelMatrix, vertexOutput);
    #else
        vertexOutput.position = uniforms.projViewModelMatrix * position;
    #endif

    vertexOutput.vUv = vertexInput.aTexCoord;

    #if HAS_SHADOWING && !HAS_BLOOM
        shadow_computeShadowPars(position, &vertexOutput);
    #endif

    return vertexOutput;
}
