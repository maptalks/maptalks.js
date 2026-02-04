struct SnowUniforms {
    fixedC: vec3f,
};

@group(0) @binding($b) var<uniform> snowUniforms: SnowUniforms;
@group(0) @binding($b) var perlinTexture: texture_2d<f32>;
@group(0) @binding($b) var perlinTextureSampler: sampler;

fn lerp(a: f32, b: f32, w: f32) -> f32 {
    return a + w * (b - a);
}

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let snowIntense = textureSample(perlinTexture, perlinTextureSampler, vertexOutput.vTexCoord).r;

    let r = lerp(0.5, snowUniforms.fixedC.x, snowIntense);
    let g = lerp(0.5, snowUniforms.fixedC.y, snowIntense);
    let b = lerp(0.5, snowUniforms.fixedC.z, snowIntense);

    return vec4f(r, g, b, 1.0);
}
