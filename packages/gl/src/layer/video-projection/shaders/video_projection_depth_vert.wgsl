// 视频投影深度渲染顶点着色器（WebGPU/WGSL 版本）
// 与 GLSL depth.vert 对应：IS_TERRAIN 分支用 flatMask 高程，非地形分支用 get_output 标准位置
// 注意：
// 1. 输出结构体必须定义在条件分支之外（两个分支共用），因为管线构建阶段需要从顶点着色器中
//    提取它注入到片元着色器，若只定义在被丢弃的分支内，地形模式下会导致片元着色器解析失败；
// 2. 非地形分支的顶点输入结构体会被 shaderlib 自动填充实例属性（instance_vectorA 等），
//    因此地形分支必须使用 Terrain 前缀的输入结构体名，避免正则误匹配被 #if 丢弃的分支。
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) vHighPrecisionZW: vec2f,
};

#if IS_TERRAIN

#include <common_pack_float>

// mesh 拥有的 uniform（projViewModelMatrix/positionMatrix 均为 mesh uniform）
struct TerrainMeshUniforms {
    projViewModelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
};
// 全局 uniform
struct TerrainGlobalUniforms {
    minAltitude: f32,
};
@group(0) @binding($b) var<uniform> meshUniforms: TerrainMeshUniforms;
@group(0) @binding($b) var<uniform> globalUniforms: TerrainGlobalUniforms;
@group(0) @binding($b) var flatMaskSampler: sampler;
@group(0) @binding($b) var flatMask: texture_2d<f32>;

struct TerrainVertexInput {
    @location($i) aPosition: vec3f,
    @location($i) aTexCoord: vec2f,
};

@vertex
fn main(vertexInput: TerrainVertexInput) -> VertexOutput {
    var output: VertexOutput;
    var uv: vec2f = vertexInput.aTexCoord;
    uv.y = 1.0 - uv.y;
    // WGSL 中 textureSample 不能用于 vertex 阶段（依赖隐式导数），须用 textureSampleLevel 显式指定 lod
    let encodedHeight: vec4f = textureSampleLevel(flatMask, flatMaskSampler, uv, 0.0);
    var altitude: f32 = vertexInput.aPosition.z;
    if (length(encodedHeight) < 2.0) {
        let maskHeight: f32 = decodeFloat32(encodedHeight);
        altitude = min(vertexInput.aPosition.z, maskHeight);
    }
    var position: vec4f = vec4f(vertexInput.aPosition.xy, altitude + globalUniforms.minAltitude, 1.0);
    position = meshUniforms.positionMatrix * position;
    output.position = meshUniforms.projViewModelMatrix * position;
    output.vHighPrecisionZW = output.position.zw;
    return output;
}

#else

#include <get_output>

// mesh 拥有的 uniform
struct Uniforms {
    projViewModelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
};
@group(0) @binding($b) var<uniform> uniforms: Uniforms;

struct VertexInput {
    #include <position_vert>
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let localPositionMatrix: mat4x4f = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);
    output.position = uniforms.projViewModelMatrix * localPositionMatrix * getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);
    output.vHighPrecisionZW = output.position.zw;
    return output;
}

#endif
