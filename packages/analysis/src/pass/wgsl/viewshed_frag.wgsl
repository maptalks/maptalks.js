#include <unpack_depth_functions>

// Uniform 结构体
struct FragUniforms {
    near: f32,
    far: f32,
    #ifdef HAS_HELPERLINE
    lineColor: vec3f,
    #endif
};

@group(0) @binding($b) var<uniform> uniforms: FragUniforms;

// Texture 和 Sampler
@group(0) @binding($b) var depthMap: texture_2d<f32>;
@group(0) @binding($b) var depthMapSampler: sampler;

// 常量定义
const UnpackDownscale: f32 = 255.0 / 256.0;
const PackFactors: vec3f = vec3f(256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0);
const UnpackFactors: vec4f = vec4f(UnpackDownscale / PackFactors, UnpackDownscale);

fn unpackRGBAToDepth(v: vec4f) -> f32 {
    return dot(v, UnpackFactors);
}

fn linear(value: f32) -> f32 {
    let z: f32 = value * 2.0 - 1.0;
    return (2.0 * uniforms.near * uniforms.far) / (uniforms.far + uniforms.near - z * (uniforms.far - uniforms.near));
}

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    #ifdef HAS_HELPERLINE
        return vec4f(uniforms.lineColor, 0.009);
    #else
        let shadowCoord: vec3f = (vertexOutput.viewshed_positionFromViewpoint.xyz / vertexOutput.viewshed_positionFromViewpoint.w) / 2.0 + 0.5;

        // WGSL 纹理采样方式
        let rgbaDepth: vec4f = textureSample(depthMap, depthMapSampler, shadowCoord.xy);
        let depth: f32 = unpackRGBAToDepth(rgbaDepth);
        let linearZ: f32 = linear(shadowCoord.z);
        let linearDepth: f32 = linear(depth);

        if (shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 &&
            shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0 &&
            linearZ >= uniforms.near && linearZ <= uniforms.far - uniforms.near) {

            if (linearZ / uniforms.far <= linearDepth / (uniforms.far - uniforms.near)) {
                return vec4f(0.0, 1.0, 0.0, 1.0); // 可视区
            } else {
                return vec4f(1.0, 0.0, 0.0, 1.0); // 不可视区
            }
        } else {
            return vec4f(0.0, 0.0, 1.0, 1.0);
        }
    #endif
}
