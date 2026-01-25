@group(0) @binding($b) var depthMap: texture_2d<f32>;
@group(0) @binding($b) var depthMapSampler: sampler;

const UnpackDownscale: f32 = 255.0 / 256.0;
const PackFactors: vec3f = vec3f(256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0);
const UnpackFactors: vec4f = vec4f(UnpackDownscale / PackFactors, UnpackDownscale);

fn unpackRGBAToDepth(v: vec4f) -> f32 {
    return dot(v, UnpackFactors);
}

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let viewpoint = vertexOutput.viewpoint;
    let shadowCoord = vec3f((viewpoint.xy / viewpoint.w) / 2.0 + 0.5, viewpoint.z / viewpoint.w);
    let rgbaDepth = textureSample(depthMap, depthMapSampler, shadowCoord.xy);
    let depth = unpackRGBAToDepth(rgbaDepth);

    var color: vec4f;

    if (shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 &&
        shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0 &&
        shadowCoord.z <= 1.0) {

        if (depth < 0.001) {
            color = vec4f(0.0, 1.0, 0.0, 1.0); // 可视区, green
        } else {
            if (shadowCoord.z <= depth + 0.002) {
                color = vec4f(0.0, 1.0, 0.0, 1.0); // 可视区, green
            } else {
                color = vec4f(1.0, 0.0, 0.0, 1.0); // 不可视区, red
            }
        }
    } else {
        color = vec4f(0.0, 0.0, 1.0, 1.0); // 非视野范围, blue
    }

    return color;
}
