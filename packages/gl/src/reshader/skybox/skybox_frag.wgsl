#include <hsv_frag>

struct SkyboxUniforms {
    hsv: vec3f,
    #ifdef USE_AMBIENT
        diffuseSPH: array<vec3f, 9>,
    #else
        bias: f32,
        size: f32,
    #endif
    environmentExposure: f32,
    backgroundIntensity: f32,
};

@group(0) @binding($b) var<uniform> uniforms: SkyboxUniforms;

#ifndef USE_AMBIENT
    @group(0) @binding($b) var cubeMap: texture_cube<f32>;
    @group(0) @binding($b) var cubeMapSampler: sampler;
#endif

fn textureCubeFixed(tex: texture_cube<f32>, texSampler: sampler, R: vec3f, size: f32, bias: f32) -> vec4f {
    var dir: vec3f = R;
    return textureSampleLevel(tex, texSampler, dir, bias);
}

fn computeDiffuseSPH(normal: vec3f, diffuseSPH: array<vec3f, 9>) -> vec3f {
    let x: f32 = normal.x;
    let y: f32 = normal.y;
    let z: f32 = normal.z;

    var result: vec3f = (
        diffuseSPH[0] +
        diffuseSPH[1] * x +
        diffuseSPH[2] * y +
        diffuseSPH[3] * z +
        diffuseSPH[4] * z * x +
        diffuseSPH[5] * y * z +
        diffuseSPH[6] * y * x +
        diffuseSPH[7] * (3.0 * z * z - 1.0) +
        diffuseSPH[8] * (x * x - y * y)
    );
    return max(result, vec3f(0.0));
}

fn pseudoRandom(fragCoord: vec2f) -> f32 {
    var p3: vec3f = fract(vec3f(fragCoord.x, fragCoord.y, fragCoord.x) * 0.1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

#if TONE_MAPPING
    const toneMappingExposure: f32 = 1.0;

    fn RRTAndODTFit(v: vec3f) -> vec3f {
        let a: vec3f = v * (v + 0.0245786) - 0.000090537;
        let b: vec3f = v * (0.983729 * v + 0.4329510) + 0.238081;
        return a / b;
    }

    fn ACESFilmicToneMapping(color: vec3f) -> vec3f {
        const ACESInputMat: mat3x3f = mat3x3f(
            vec3f(0.59719, 0.07600, 0.02840),
            vec3f(0.35458, 0.90834, 0.13383),
            vec3f(0.04823, 0.01566, 0.83777)
        );
        const ACESOutputMat: mat3x3f = mat3x3f(
            vec3f(1.60475, -0.10208, -0.00327),
            vec3f(-0.53108, 1.10813, -0.07276),
            vec3f(-0.07367, -0.00605, 1.07602)
        );
        var adjustedColor: vec3f = color * toneMappingExposure / 0.6;
        adjustedColor = ACESInputMat * adjustedColor;
        adjustedColor = RRTAndODTFit(adjustedColor);
        adjustedColor = ACESOutputMat * adjustedColor;
        return clamp(adjustedColor, 0, 1);
    }

    fn toneMapping(color: vec3f) -> vec3f {
        return ACESFilmicToneMapping(color);
    }

    fn sRGBTransferOETF(value: vec4f) -> vec4f {
        var result: vec3f;
        let threshold: vec3f = vec3f(0.0031308);

        // 分量-wise 比较
        for (var i: i32 = 0; i < 3; i++) {
            if (value[i] <= threshold[i]) {
                result[i] = value[i] * 12.92;
            } else {
                result[i] = pow(value[i], 0.41666) * 1.055 - 0.055;
            }
        }
        return vec4f(result, value.a);
    }

    fn linearToOutputTexel(value: vec4f) -> vec4f {
        return sRGBTransferOETF(value);
    }
#endif

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    var envColor: vec4f;

    #ifdef USE_AMBIENT
        var normal: vec3f = normalize(
            vertexOutput.vWorldPos +
            mix(-0.5/255.0, 0.5/255.0, pseudoRandom(vertexOutput.fragCoord.xy)) * 2.0
        );
        envColor = vec4f(computeDiffuseSPH(normal, uniforms.diffuseSPH), 1.0);
    #else
        envColor = textureCubeFixed(
            cubeMap,
            cubeMapSampler,
            vertexOutput.vWorldPos,
            uniforms.size,
            uniforms.bias
        );
    #endif

    var rgb = envColor.rgb;
    rgb *= uniforms.environmentExposure;
    rgb *= uniforms.backgroundIntensity;

    if (length(uniforms.hsv) > 0.0) {
        rgb = hsv_apply3(clamp(rgb, vec3f(0.0), vec3f(1.0)), uniforms.hsv);
    }

    #if TONE_MAPPING
        rgb = toneMapping(rgb);
        let fragColor = linearToOutputTexel(vec4f(rgb, envColor.a));
    #else
        let fragColor = vec4f(rgb, envColor.a);
    #endif

    return fragColor;
}
