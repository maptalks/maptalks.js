#if HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_frag>
#endif

struct VertexOutput {
#ifdef HAS_PATTERN
    @location($i) vTexCoord: vec2f,
#endif
};

struct BackFillUniforms {
    polygonFill: vec4f,
    polygonOpacity: f32,
};

@group(0) @binding($b) var<uniform> uniforms: BackFillUniforms;

#ifdef HAS_PATTERN
@group(0) @binding($b) var polygonPatternFile: texture_2d<f32>;
@group(0) @binding($b) var polygonPatternFileSampler: sampler;
#endif

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
#ifdef HAS_PATTERN
    let color = textureSample(polygonPatternFile, polygonPatternFileSampler, vertexOutput.vTexCoord);
#else
    let color = uniforms.polygonFill;
#endif

    var fragColor: vec4f = color * uniforms.polygonOpacity;

#if HAS_SHADOWING && !HAS_BLOOM
    let shadowCoeff = shadow_computeShadow(vertexOutput);
    fragColor = vec4(shadow_blend(fragColor.rgb, shadowCoeff), fragColor.a);
#endif

    return fragColor;
}
