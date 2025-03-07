struct Scene {
    opacity : f32,
    baseColor : vec4f,
    alphaTest : f32,
}

@group(0) @binding(1) var<uniform> scene: Scene;
@group(0) @binding(2) var baseColorTextureSampler: sampler;
@group(0) @binding(3) var baseColorTexture: texture_2d<f32>;

#if HAS_DEBUG
    @group(0) @binding(4) var debugTextureSampler: sampler;
    @group(0) @binding(5) var debugTexture: texture_2d<f32>;
#endif

@fragment
fn main(
    @location(0) vTexCoord : vec2f
) -> @location(0) vec4f {
    var fragColor = textureSample(baseColorTexture, baseColorTextureSampler, vTexCoord);
    // fragColor *= scene.baseColor;
    #if HAS_DEBUG
        var debugColor = textureSample(debugTexture, debugTextureSampler, vTexCoord);
        fragColor = vec4f(
            debugColor.rgb + fragColor.rgb * (1.0 - debugColor.a),
            debugColor.a + fragColor.a * (1.0 - debugColor.a)
        );
    #endif
    if (fragColor.a < scene.alphaTest) {
        // discard;
    }
    return fragColor * 1.0;
    // return vec4f(1.0, 0.0, 0.0, 1.0);
}
