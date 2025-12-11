#include <vsm_shadow_frag>

struct ShadowDisplayUniforms3 {
    color: vec3f,
};

@group(0) @binding($b) var<uniform> uniforms: ShadowDisplayUniforms3;

struct VertexOutput {
    @builtin(position) position: vec4f,
};

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let visibility = shadow_computeShadow(vertexOutput);
    let alpha = 1.0 - visibility;

    return vec4f(uniforms.color * alpha, alpha);
}
