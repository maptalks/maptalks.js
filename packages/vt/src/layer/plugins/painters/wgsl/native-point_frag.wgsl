struct MarkerFragmentUniforms {
    markerOpacity: f32,
    #ifndef HAS_COLOR
        markerFill: vec3f,
    #endif
}

@group(0) @binding($b) var<uniform> uniforms: MarkerFragmentUniforms;
@group(0) @binding($b) var<uniform> layerOpacity: f32;
#ifdef HAS_COLOR
struct VertexOuput {
    @location($i) vColor: vec4f,
}
#endif

@fragment
fn main(
    #ifdef HAS_COLOR
    vertexOutput: VertexOuput,
    #endif
) -> @location(0) vec4f {
    var alpha: f32 = 1.0;
    #ifdef USE_CIRCLE
    #endif

    var pointColor: vec4f;
    #ifdef HAS_COLOR
        pointColor = vertexOutput.vColor;
    #else
        pointColor = vec4f(uniforms.markerFill, 1.0);
    #endif
    let color = pointColor * uniforms.markerOpacity * alpha * layerOpacity;
    if (color.a <= 0.01) {
        discard;
    }
    return color;
}
