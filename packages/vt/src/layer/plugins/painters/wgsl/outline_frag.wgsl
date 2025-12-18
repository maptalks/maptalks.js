struct OutlineUniforms {
    highlightPickingId: f32,
}

@group(0) @binding($b) var<uniform> uniforms: OutlineUniforms;

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    if (uniforms.highlightPickingId < 0.0 ||
        floor(uniforms.highlightPickingId + 0.5) == floor(vertexOutput.vPickingId + 0.5)) {
        return vec4f(1.0);
    } else {
        discard;
        return vec4f(0.0);
    }
}
