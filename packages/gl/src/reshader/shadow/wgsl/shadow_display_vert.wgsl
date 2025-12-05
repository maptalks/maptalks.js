#include <vsm_shadow_vert>

struct VertexInput {
    @location($i) aPosition: vec3f,
};

struct VertexOutput {
    @builtin(position) position: vec4f,
};

struct ShadowDisplayUniforms2 {
    projViewModelMatrix: mat4x4f,
};

@group(0) @binding($b) var<uniform> uniforms: ShadowDisplayUniforms2;

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    let pos = vec4f(vertexInput.aPosition, 1.0);
    output.position = uniforms.projViewModelMatrix * pos;

    shadow_computeShadowPars(pos, &output);

    return output;
}
