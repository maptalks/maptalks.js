struct MarkerFragmentUniforms {
    markerOpacity: f32,
    #ifndef HAS_COLOR
        markerFill: vec3f,
    #endif
}

@group(0) @binding($b) var<uniform> uniforms: MarkerFragmentUniforms;
@group(0) @binding($b) var<uniform> layerOpacity: f32;

@fragment
fn main(
    vertexOutput: VertexOutput
) -> @location(0) vec4f {
    var alpha: f32 = 1.0;
    #ifdef USE_CIRCLE
        let uv = vertexOutput.vUv;
        let center = vec2f(0.5, 0.5);
        let dist = distance(uv, center);
        let radius = 0.5;
        // 使用抗锯齿（可选）
        let smooth_width = 0.05;
        let alpha_circle = 1.0 - smoothstep(radius - smooth_width, radius, dist);
        alpha = alpha_circle;
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
