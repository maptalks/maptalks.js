// 常量定义
const SHIFT_RIGHT_11 = 1.0 / 2048.0;
const SHIFT_RIGHT_5 = 1.0 / 32.0;
const SHIFT_LEFT_11 = 2048.0;
const SHIFT_LEFT_5 = 32.0;
const NORMALIZE_6 = 1.0 / 64.0;
const NORMALIZE_5 = 1.0 / 32.0;

// Uniform结构体
struct PointUniforms {
    pointColor: vec4f,
    pointSize: f32,
    projViewModelMatrix: mat4x4f,
    pointOpacity: f32,
     #ifdef HAS_NORMAL
        lightDir: vec3f,
        modelNormalMatrix: mat3x3f,
        positionMatrix: mat4x4f,
    #endif
};
@group(0) @binding($b) var<uniform> uniforms: PointUniforms;


// 顶点输入结构体
struct VertexInput {
    #ifdef HAS_POSITION
        #include <position_vert>
    #endif
    #if HAS_RGB
        @location($i) RGB: vec3u,
    #elif HAS_RGBA
        @location($i) RGBA: vec4u,
    #elif HAS_RGB565
        RGB565: u32,
    #endif
    #ifdef HAS_NORMAL
        #ifdef HAS_NORMAL_OCT16P
            @location($i) NORMAL_OCT16P: vec2f,
        #else
            @location($i) NORMAL: vec3f,
        #endif
    #endif
};

// 顶点输出结构体
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) vColor: vec4f,
};

// 辅助函数
fn signNotZero(value: f32) -> f32 {
    return select(-1.0, 1.0, value >= 0.0);
}

fn signNotZero_vec2(value: vec2f) -> vec2f {
    return vec2f(signNotZero(value.x), signNotZero(value.y));
}

fn octDecode(encoded: vec2f, range: f32) -> vec3f {
    if (encoded.x == 0.0 && encoded.y == 0.0) {
        return vec3f(0.0, 0.0, 0.0);
    }
    var decoded = encoded / range * 2.0 - 1.0;
    var v = vec3f(decoded.x, decoded.y, 1.0 - abs(decoded.x) - abs(decoded.y));
    if (v.z < 0.0) {
        v = vec3f((1.0 - abs(v.yx)) * signNotZero_vec2(v.xy), v.z);
    }
    return normalize(v);
}

fn octDecode_simple(encoded: vec2f) -> vec3f {
    return octDecode(encoded, 255.0);
}

fn getLambertDiffuse(lightDir: vec3f, normal: vec3f) -> f32 {
    return max(dot(-lightDir, normal), 0.0);
}

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif
#include <draco_decode_vert>
// 主函数
@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    #ifdef HAS_POSITION
        var localPos = decode_getPosition(vec3f(input.aPosition.xyz));
    #endif

    output.position = uniforms.projViewModelMatrix * vec4f(localPos, 1.0);
    // output.pointSize = uniforms.pointSize;

    #ifdef PICKING_MODE
        fbo_picking_setData(input, &output, output.position.w, true);
    #else
        #if HAS_RGB
            output.vColor = vec4f(vec3f(input.RGB) / 255.0, 1.0) * uniforms.pointOpacity;
        #elif HAS_RGBA
            output.vColor = vec4f(vec4f(input.RGBA) / 255.0) * uniforms.pointOpacity;
        #elif HAS_RGB565
            var compressed = f32(input.RGB565);
            var r = floor(compressed * SHIFT_RIGHT_11);
            compressed -= r * SHIFT_LEFT_11;
            var g = floor(compressed * SHIFT_RIGHT_5);
            compressed -= g * SHIFT_LEFT_5;
            var b = compressed;
            var rgb = vec3f(r * NORMALIZE_5, g * NORMALIZE_6, b * NORMALIZE_5);
            output.vColor = vec4f(rgb, 1.0);
        #else
            output.vColor = uniforms.pointColor;
        #endif

        #ifdef HAS_NORMAL
            var positionNormalMatrix = mat3x3f(uniforms.positionMatrix);
            var normalMatrix = uniforms.modelNormalMatrix * positionNormalMatrix;
            #ifdef HAS_NORMAL_OCT16P
                var localNormal = octDecode_simple(input.NORMAL_OCT16P);
            #else
                var localNormal = input.NORMAL;
            #endif
            var normal = normalize(normalMatrix * localNormal);
            var colorStrength = getLambertDiffuse(uniforms.lightDir, normal);
            colorStrength = max(colorStrength, 0.5);
            output.vColor *= colorStrength;
        #endif
    #endif

    return output;
}
