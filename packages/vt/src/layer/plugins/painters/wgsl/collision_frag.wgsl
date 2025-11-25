struct VertexOutput {
    @location($i) vColor: vec4f,
};

@fragment
fn main(
    input : VertexOutput,
) -> @location(0) vec4f {
    return input.vColor;
}
