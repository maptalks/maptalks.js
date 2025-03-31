struct Uniforms {
    lineOpacity: f32,
    lineColor: vec4f,
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;
@group(0) @binding($b) var<uniform> layerOpacity: f32;

#if HAS_COLOR
    struct VertexOuput {
        @location(0) vColor: vec4f,
    };
#endif

@fragment
fn main(
    #if HAS_COLOR
        input: VertexOuput
    #endif
) -> @location(0) vec4f {
    var outputColor: vec4f = uniforms.lineColor * uniforms.lineOpacity;

    #if HAS_COLOR
        outputColor *= input.vColor;
    #endif

    outputColor *= layerOpacity;

    return outputColor;
}
