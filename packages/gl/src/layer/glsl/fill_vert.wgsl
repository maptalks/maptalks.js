#include <vsm_shadow_vert>

struct VertexInput {
    @location($i) aPosition: vec3f,
#ifdef HAS_PATTERN
    @location($i) aTexCoord: vec2f,
#endif
};

struct VertexOutput {
    @builtin(position) Position: vec4f,
#ifdef HAS_PATTERN
    @location($o) vTexCoord: vec2f,
#endif
};

struct BackFillUniforms {
    projViewModelMatrix: mat4x4f,
    modelMatrix: mat4x4f,
#ifdef HAS_PATTERN
    uvScale: vec2f,
    uvOffset: vec2f,
#endif
};

@group(0) @binding($b) var<uniform> uniforms: BackFillUniforms;

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var vertexOutput: VertexOutput;

#ifdef HAS_PATTERN
    vertexOutput.vTexCoord = vertexInput.aTexCoord * uniforms.uvScale + uniforms.uvOffset;
#endif

    let position = vec3f(vertexInput.aPosition);
    vertexOutput.Position = uniforms.projViewModelMatrix * vec4f(position, 1.0);

#if HAS_SHADOWING && !HAS_BLOOM
    shadow_computeShadowPars(uniforms.modelMatrix * vec4f(position, 1.0));
#endif

    return vertexOutput;
}
