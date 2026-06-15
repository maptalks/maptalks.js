// Uniform 结构体
struct FragUniforms {
    near: f32,
    far: f32,
};

#ifdef HAS_HELPERLINE
    struct HelperUniforms {
        lineColor: vec3f,
    };
#endif

@group(0) @binding($b) var<uniform> uniforms: FragUniforms;
#ifdef HAS_HELPERLINE
    @group(0) @binding($b) var<uniform> helperUniforms: HelperUniforms;
#endif

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
    let near = uniforms.near;
    let far = uniforms.far;

    let z = value;
    return (near * far) / (far - z * (far - near));
}

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    #ifdef HAS_HELPERLINE
        return vec4f(helperUniforms.lineColor, 0.009);
    #else
        let near = uniforms.near;
        let far = uniforms.far;
        let viewpoint = vertexOutput.viewpoint;

        let viewCoord: vec3f = viewpoint.xyz / viewpoint.w;
        // WebGPU的NDC深度范围是[0, 1]，不需要像WebGL那样/2.0 + 0.5转换
        let shadowCoord: vec3f = vec3f(viewCoord.xy / 2.0 + 0.5, viewCoord.z);
        let uv = vec2f(shadowCoord.x, 1 - shadowCoord.y);
        let rgbaDepth: vec4f = textureSample(depthMap, depthMapSampler, uv);
        let depth: f32 = unpackRGBAToDepth(rgbaDepth);
        let linearDepth: f32 = linear(depth);
        let linearZ: f32 = linear(shadowCoord.z);

        if (shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 &&
            shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0 &&
            linearZ >= near && linearZ <= far - near) {
            let delta = (far - near) * 0.05;
            if (linearZ <= (linearDepth + delta)) {
                return vec4f(0.0, 1.0, 0.0, 1.0); // 可视区
            } else {
                return vec4f(1.0, 0.0, 0.0, 1.0); // 不可视区
            }
        } else {
            return vec4f(0.0, 0.0, 1.0, 1.0);
        }
    #endif
}
