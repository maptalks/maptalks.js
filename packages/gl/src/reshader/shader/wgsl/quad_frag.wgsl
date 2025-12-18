#define SHADER_NAME QUAD

struct QuadFragUniforms {
    outputSize: vec2f,
    inputSize: vec2f,
};

@group(0) @binding($b) var<uniform> uniforms: QuadFragUniforms;
#ifdef HAS_MULTISAMPLED
    @group(0) @binding($b) var TextureInput: texture_multisampled_2d<f32>;
#else
    @group(0) @binding($b) var TextureInput: texture_2d<f32>;
#endif
@group(0) @binding($b) var TextureInputSampler: sampler;

@fragment
fn main(
    vertexOutput: VertexOutput
) -> @location(0) vec4f {
    let uv = vertexOutput.position.xy;
    #ifdef HAS_MULTISAMPLED
        let color = textureLoad(TextureInput, vec2i(uv / uniforms.outputSize * uniforms.inputSize), 0);
    #else
        let color = textureSample(TextureInput, TextureInputSampler, uv / uniforms.outputSize);
    #endif

    return color;
}
