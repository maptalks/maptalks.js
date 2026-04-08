
#define SHADER_NAME PNTS

struct FragmentUniforms {
    layerOpacity: f32,
};
@group(0) @binding($b) var<uniform> uniforms: FragmentUniforms;


@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    var fragColor = vertexOutput.vColor;
    #ifdef HAS_LAYER_OPACITY
        fragColor *= uniforms.layerOpacity;
    #endif
    return fragColor;
}
