#define SHADER_NAME TERRAIN_MESH

#include <mask_vert>
#if HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_vert>
#endif


struct MatrixUniforms {
    projMatrix: mat4x4f,
    heightScale: f32,
};

struct TerrainUniforms {
    minAltitude: f32,
    projViewModelMatrix: mat4x4f,
    modelMatrix: mat4x4f,
    modelViewMatrix: mat4x4f,
    positionMatrix: mat4x4f,
};

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location($o) vUv: vec2f,
};

struct VertexInput {
    @location($i) aPosition: vec3f,
    @location($i) aTexCoord: vec2f,
};

@group(0) @binding($b) var<uniform> matrixUniforms: MatrixUniforms;
@group(0) @binding($b) var<uniform> uniforms: TerrainUniforms;

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var vertexOutput: VertexOutput;

    var position = vec4f(vertexInput.aPosition.xy, (vertexInput.aPosition.z + uniforms.minAltitude) * matrixUniforms.heightScale, 1.0);
    position = uniforms.positionMatrix * position;

    #ifdef HAS_MASK_EXTENT
        vertexOutput.position = matrixUniforms.projMatrix * getMaskPosition(position, uniforms.modelMatrix, vertexOutput);
    #else
        vertexOutput.position = uniforms.projViewModelMatrix * position;
    #endif

    vertexOutput.vUv = vertexInput.aTexCoord;

    #if HAS_SHADOWING && !HAS_BLOOM
        shadow_computeShadowPars(position, &vertexOutput);
    #endif

    return vertexOutput;
}
