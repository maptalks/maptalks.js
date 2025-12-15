#ifdef PACK_FLOAT
    #include <common_pack_float>
#endif

struct FragmentOutput {
    @location(0) color: vec4f,
};

@fragment
fn main(
    vertexOutput: VertexOutput
) -> @location(0) vec4f {
    var color: vec4f;
    #if USE_ESM
        #ifdef PACK_FLOAT
            color = common_encodeDepth(vertexOutput.position.z);
        #else
            color = vec4f(vertexOutput.position.z, 0.0, 0.0, 1.0);
        #endif
    #endif

    return color;
}
