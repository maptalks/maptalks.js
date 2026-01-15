struct BillboardFragmentUniforms {
    textureSize: vec2f,
};

@group(0) @binding($b) var<uniform> uniforms: BillboardFragmentUniforms;
@group(0) @binding($b) var billTexture: texture_2d<f32>;
@group(0) @binding($b) var billTextureSampler: sampler;

#if HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_frag>
#endif

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    var fragColor: vec4f = textureSample(billTexture, billTextureSampler, vertexOutput.vTexCoord / uniforms.textureSize);

    #if HAS_SHADOWING && !HAS_BLOOM
        let shadowCoeff = shadow_computeShadow();
        fragColor.rgb = shadow_blend(fragColor.rgb, shadowCoeff);
    #endif

    // fragColor = vec4f(vertexOutput.vTexCoord / uniforms.textureSize, 0.0, 1.0);
    // fragColor = vec4f(1.0, 0.0, 0.0, 1.0);

    return fragColor;
}
