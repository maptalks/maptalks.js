#include <common_pack_float>

struct Uniforms {
    resolution: vec2f
};

struct VertexOutput {
    @location($i) vTexCoord: vec2f,
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;
#ifdef HAS_MULTISAMPLED
@binding($b) @group(0) var textureSource: texture_multisampled_2d<f32>;
#else
@binding($b) @group(0) var textureSource: texture_2d<f32>;
#endif
@group(0) @binding($b) var textureSourceSampler: sampler;

fn sign_positive(x: f32) -> f32 {
    return select(0.0, 1.0, x > 0.0);
}

@fragment
fn main(vertexOutput: VertexOutput) ->  @location(0) vec4f {
    var c: f32 = 0.0;
    var weight: f32 = 0.0;

    let offset = BOXBLUR_OFFSET;

    for (var x: i32 = -offset; x <= offset; x++) {
        for (var y: i32 = -offset; y <= offset; y++) {
            var uv: vec2f = vertexOutput.vTexCoord + vec2f(f32(x) / uniforms.resolution.x, f32(y) / uniforms.resolution.y);
            uv = clamp(uv, vec2f(0.0), vec2f(1.0));
            #ifdef HAS_MULTISAMPLED
                let texColor = textureLoad(textureSource, vec2i(uv * vec2f(uniforms.resolution)), 0);
            #else
                let texColor = textureSample(textureSource, textureSourceSampler, uv);
            #endif
            let depth = common_decodeDepth(texColor);

            let s = max(0.0, sign_positive(1.0 - depth));
            weight += sign(depth) * s;
            c += depth;
        }
    }

    let avgDepth: f32 = c / max(1.0, weight);
    let encodedDepth = common_encodeDepth(avgDepth);

    return encodedDepth;
}
