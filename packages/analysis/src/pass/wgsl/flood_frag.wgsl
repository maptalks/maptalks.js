struct FloodAnalysisUniforms {
    extent: vec4f,
    waterHeight: f32,
    hasExtent: f32,
    analysisType: f32,
};

@group(0) @binding($b) var<uniform> floodAnalysisUniforms: FloodAnalysisUniforms;
@group(0) @binding($b) var extentMap: texture_2d<f32>;
@group(0) @binding($b) var extentMapSampler: sampler;

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let extent = floodAnalysisUniforms.extent;
    let waterHeight = floodAnalysisUniforms.waterHeight;
    let hasExtent = floodAnalysisUniforms.hasExtent;
    let analysisType = floodAnalysisUniforms.analysisType;

    let width = extent.z - extent.x;
    let height = extent.y - extent.w;
    let uvInExtent = vec2f(
        (vertexOutput.vWorldPosition.x - extent.x) / width,
        (vertexOutput.vWorldPosition.y - extent.w) / height
    );

    let extentColor = textureSample(extentMap, extentMapSampler, uvInExtent);

    var compare: bool;
    if (analysisType == 1.0) {
        compare = vertexOutput.flood_height < waterHeight;
    } else {
        compare = vertexOutput.flood_height >= waterHeight;
    }

    var color: vec4f = vec4f(0.0);

    if (compare) {
        if (hasExtent == 1.0) {
            if (extentColor.r > 0.0) {
                color = vec4f(1.0, 0.0, 0.0, 1.0);
            }
        } else {
            color = vec4f(1.0, 0.0, 0.0, 1.0);
        }
    }

    return color;
}
