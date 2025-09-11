struct Uniforms {
    projViewModelMatrix : mat4x4f
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) vTexCoord : vec2f
}

@vertex
fn main(
    @location(0) aPosition : vec2i,
    @location(1) aTexCoord : vec2u
) -> VertexOutput {
    var output : VertexOutput;
    output.Position = uniforms.projViewModelMatrix * vec4f(vec2f(aPosition), 0.0, 1.0);
    output.vTexCoord = vec2f(aTexCoord);
    return output;
}
