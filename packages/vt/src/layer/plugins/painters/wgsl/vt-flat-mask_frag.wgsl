#include <common_pack_float>

@fragment
fn main(output: VertexOutput) -> @location(0) vec4f {
    return encodeFloat32(output.vAltitude);
}
