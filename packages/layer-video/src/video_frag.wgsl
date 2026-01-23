// 其他uniform变量放到struct中
struct FragUniforms {
    opacity: f32
}

// 纹理相关的uniform变量
@group(0) @binding($b) var videoTexture: texture_2d<f32>;
@group(0) @binding($b) var videoTextureSampler: sampler;
@group(0) @binding($b) var<uniform> fragUniforms: FragUniforms;

// 片段着色器入口函数
@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    // 采样纹理（对应texture2D）
    let color = textureSample(videoTexture, videoTextureSampler, vertexOutput.vTexCoords);

    // 应用透明度（假设uniforms是全局变量，包含videoEffectUniforms）
    return color * fragUniforms.opacity;
    // return vec4f(1, 0, 0, 1);
}
