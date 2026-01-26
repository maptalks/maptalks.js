#include <get_output>
#include <fbo_picking_vert>

// Uniform 结构体
struct Uniforms {
    modelMatrix: mat4x4f,
    #ifdef HAS_MASK_EXTENT
        modelViewMatrix: mat4x4f,
    #endif
    positionMatrix: mat4x4f
};

struct ShaderUniforms {
    projMatrix: mat4x4f,
}

@group(0) @binding($b) var<uniform> uniforms: Uniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;

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
    #if HAS_COLOR
        @location($i) aColor: vec4u,
    #endif
    #if HAS_COLOR0
        #if COLOR0_SIZE == 3
            @location($i) aColor0: vec3u,
        #else
            @location($i) aColor0: vec4u,
        #endif
    #endif
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) viewpoint: vec4f,
};

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let localPositionMatrix: mat4x4f = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);
    let localVertex = getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);
    let position: vec4f = localPositionMatrix * localVertex;
    let viewVertex = uniforms.modelMatrix * position;
    let projMatrix = shaderUniforms.projMatrix;
    #ifdef HAS_MASK_EXTENT
        output.position = projMatrix * getMaskPosition(position, uniforms.modelMatrix);
    #else
        output.position = projMatrix * viewVertex;
    #endif

    var alpha = 1.0;
    #if HAS_COLOR
        alpha *= vertexInput.aColor.a;
    #endif
    #if HAS_COLOR0 && COLOR0_SIZE == 4
        alpha *= vertexInput.aColor0.a;
    #endif

    fbo_picking_setData(vertexInput, &output, output.position.w, alpha != 0.0);
    return output;
}
