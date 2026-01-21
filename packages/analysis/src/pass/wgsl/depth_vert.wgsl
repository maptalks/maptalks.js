#include <get_output>

// Uniform 结构体
struct Uniforms {
    projViewModelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;

// 顶点输入结构体
#ifdef HAS_ALTITUDE
struct VertexInput {
    @location($i) aPosition: vec2f,
    @location($i) aAltitude: f32,
};
#else
struct VertexInput {
    #if HAS_DRACO_POSITION || HAS_COMPRESSED_INT16_POSITION
        @location($i) aPosition: vec4i,
    #else
        #ifdef POSITION_IS_INT
            @location($i) aPosition: vec4i,
        #else
            @location($i) aPosition: vec3f,
        #endif
    #endif
};
#endif

// 顶点输出结构体
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) vHighPrecisionZW: vec2f,
    @location($o) vFragDepth: f32,
};

#ifdef HAS_ALTITUDE
fn unpackVTPosition(vertexInput: VertexInput) -> vec3f {
    return vec3f(vertexInput.aPosition, vertexInput.aAltitude);
}
#endif

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    #ifdef HAS_ALTITUDE
        let i: vec3f = unpackVTPosition(vertexInput);
        let j: vec4f = vec4f(i, 1.0);
        output.position = uniforms.projViewModelMatrix * j;
    #else
        let localPositionMatrix: mat4x4f = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);
        output.position = uniforms.projViewModelMatrix * localPositionMatrix * getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);
    #endif

    output.vFragDepth = 1.0 + output.position.w;
    output.vHighPrecisionZW = output.position.zw;

    return output;
}
