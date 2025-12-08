#define SHADER_NAME COPY_DEPTH

#include <common_pack_float>

struct CopyDepthUniforms {
    textureSize: vec2f,
};

@group(0) @binding($b) var<uniform> uniforms: CopyDepthUniforms;
#ifdef HAS_MULTISAMPLED
    @group(0) @binding($b) var TextureDepth: texture_depth_multisampled_2d;
#else
    @group(0) @binding($b) var TextureDepth: texture_depth_2d;
#endif
@group(0) @binding($b) var TextureDepthSampler: sampler;

struct VertexOutput {
    @builtin(position) position: vec4f
};

@fragment
fn main(
    vertexOutput: VertexOutput
) -> @location(0) vec4f {
    let uv = vertexOutput.position.xy;
    #ifdef HAS_MULTISAMPLED
        let depth = textureLoad(TextureDepth, vec2i(uv), 0);
    #else
        let depth = textureSample(TextureDepth, TextureDepthSampler, uv / uniforms.textureSize);
    #endif
    var fragColor = common_encodeDepth(depth);
    return fragColor;
}
