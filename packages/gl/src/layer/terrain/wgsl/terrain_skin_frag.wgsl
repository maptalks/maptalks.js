struct TerrrainSkinUniforms {
    tileSize: f32,
    skinDim: vec3f,
    opacity: f32,
}

struct VertexOutput {
    @builtin(position) fragCoord: vec4f,
}

@group(0) @binding($b) var<uniform> uniforms: TerrrainSkinUniforms;
@group(0) @binding($b) var skinTexture: texture_2d<f32>;
@group(0) @binding($b) var skinTextureSampler: sampler;

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    // 除以2是因为瓦片实际的fbo是tileSize的2倍大
    var fragCoord = vertexOutput.fragCoord.xy / 2.0;
    var resolution = vec2f(uniforms.tileSize);
    var uv = (fragCoord - uniforms.skinDim.xy) / (resolution * uniforms.skinDim.z);
    var color = textureSample(skinTexture, skinTextureSampler, uv);
    var opacity = 0.0;
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        opacity = uniforms.opacity;
    }
    // return color * uniforms.opacity;
    return color * opacity;
    // if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
    //     var color = textureSample(skinTexture, skinTextureSampler, uv);
    //     return color * uniforms.opacity;
    // } else {
    //     return vec4f(0.0);
    // }
}
