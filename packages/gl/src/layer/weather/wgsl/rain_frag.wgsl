struct RainUniforms {
    diffuse: vec3f,
    opacity: f32,
};

@group(0) @binding($b) var<uniform> rainUniforms: RainUniforms;
@group(0) @binding($b) var rainMap: texture_2d<f32>;
@group(0) @binding($b) var rainMapSampler: sampler;

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let rainColor = textureSample(rainMap, rainMapSampler, vertexOutput.vTexCoord);
    var diffuseColor = vec4f(rainUniforms.diffuse, rainUniforms.opacity);
    diffuseColor *= rainColor;
    return diffuseColor;
}
