struct VertexOutput {
    @builtin(position) position : vec4f,
    @location($o) vTexCoord: vec2f
}

@vertex
fn main(
  @location($i) aPosition: vec2f,
  @location($i) aTexCoord: vec2f
) -> VertexOutput {
  var output: VertexOutput;

  output.position = vec4f(aPosition, 0., 1.);
  output.vTexCoord = aTexCoord;

  return output;
}
