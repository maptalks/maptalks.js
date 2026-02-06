// ds魔法 请把下面的glsl代码转为wgsl，要求保留#开头的宏处理语句内的代码，变量名维持不变，非texture_2d和sampler类型的uniform变量放到一个struct中：
struct VertexInput {
#include <position_vert>
#ifdef HAS_MAP
    #if HAS_DRACO_TEXCOORD || HAS_COMPRESSED_INT16_TEXCOORD_0
        @location($i) aTexCoord: vec2i,
    #else
        @location($i) aTexCoord: vec2f,
    #endif
#ifdef HAS_I3S_UVREGION
    @location($i) uvRegion: vec4f,
#endif
#ifdef HAS_AO_MAP
    @location($i) aTexCoord1: vec2f,
#endif
#endif
#ifdef HAS_COLOR
    @location($i) aColor: vec4f,
#elif HAS_COLOR0
#if COLOR0_SIZE == 3
    @location($i) aColor0: vec3f,
#else
    @location($i) aColor0: vec4f,
#endif
#endif
#ifdef HAS_EXTRUSION_OPACITY
    @location($i) aExtrusionOpacity: f32,
#endif
#ifdef HAS_TANGENT
    @location($i) aTangent: vec4f,
#endif
#ifdef HAS_NORMAL
    #ifdef NORMAL_IS_INT
        @location($i) aNormal: vec4i,
    #elif NORMAL_IS_UINT
        @location($i) aNormal: vec4u,
    #else
        @location($i) aNormal: vec3f,
    #endif
#endif
// 动态插入include中定义的attributes
};

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location($o) vFragPos: vec3f,
    @location($o) vNormal: vec3f,
#ifdef HAS_MAP
    @location($o) vTexCoord: vec2f,
#ifdef HAS_I3S_UVREGION
    @location($o) vUvRegion: vec4f,
#endif
#ifdef HAS_AO_MAP
    @location($o) vTexCoord1: vec2f,
#endif
#endif
#ifdef HAS_COLOR || HAS_COLOR0
    @location($o) vColor: vec4f,
#endif
#if HAS_EXTRUSION_OPACITY
    @location($o) vExtrusionOpacity: f32,
#endif
#ifdef HAS_TANGENT
    @location($o) vTangent: vec4f,
#endif
// 动态插入include中定义的varyings
};

struct MatrixUniforms {
    projMatrix: mat4x4f,
    projViewMatrix: mat4x4f,
};

struct ModelUniforms {
    modelNormalMatrix: mat3x3f,
    modelViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
    uvScale: vec2f,
    uvOffset: vec2f,
};

@group(0) @binding($b) var<uniform> uniforms: MatrixUniforms;
@group(0) @binding($b) var<uniform> modelUniforms: ModelUniforms;

#include <line_extrusion_vert>
#include <highlight_vert>
#include <get_output>

#if HAS_SHADOWING && !HAS_BLOOM
#include <vsm_shadow_vert>
#endif
#include <vertex_color_vert>

fn toTangentFrame1(q: vec4f) -> vec3f {
    return vec3f(0.0, 0.0, 1.0) +
           vec3f(2.0, -2.0, -2.0) * q.x * q.zwx +
           vec3f(2.0, 2.0, -2.0) * q.y * q.wzy;
}

fn toTangentFrame(q: vec4f, n: ptr<function, vec3f>, t: ptr<function, vec3f>) {
    *n = toTangentFrame1(q);
    *t = vec3f(1.0, 0.0, 0.0) +
         vec3f(-2.0, 2.0, -2.0) * q.y * q.yxw +
         vec3f(-2.0, 2.0, 2.0) * q.z * q.zwx;
}

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var vertexOutput : VertexOutput;
#if IS_LINE_EXTRUSION
    let localPosition = getPosition(getLineExtrudePosition(vec3f(vertexInput.aPosition.xyz), vertexInput), vertexInput);
#else
    let localPosition = getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);
#endif
    let localPositionMatrix = getPositionMatrix(vertexInput, &vertexOutput, modelUniforms.positionMatrix);

    vertexOutput.vFragPos = (modelUniforms.modelMatrix * localPositionMatrix * localPosition).xyz;

#if HAS_NORMAL || HAS_TANGENT
    let localNormalMatrix = modelUniforms.modelNormalMatrix * mat3x3f(localPositionMatrix[0].xyz, localPositionMatrix[1].xyz, localPositionMatrix[2].xyz);
    var Normal: vec3f;
#if HAS_TANGENT
    var t: vec3f;
    toTangentFrame(vertexInput.aTangent, Normal, t);
    vertexOutput.vTangent = vec4f(localNormalMatrix * t, vertexInput.aTangent.w);
#else
    Normal = decode_getNormal(vec3f(vertexInput.aNormal.xyz));
#endif
    let localNormal = appendMorphNormal(Normal, vertexInput);
    vertexOutput.vNormal = normalize(localNormalMatrix * localNormal);
#else
    vertexOutput.vNormal = vec3f(0.0);
#endif

    var jitteredProjection = uniforms.projMatrix;
    // jitteredProjection[2].xy += jitterUniforms.halton.xy / jitterUniforms.outSize.xy;

#ifdef HAS_MASK_EXTENT
    vertexOutput.position = jitteredProjection * getMaskPosition(localPositionMatrix * localPosition, uniforms.modelMatrix);
#else
    vertexOutput.position = jitteredProjection * modelUniforms.modelViewMatrix * localPositionMatrix * localPosition;
#endif

#ifdef HAS_MAP
    let decodedTexCoord = decode_getTexcoord(vec2f(vertexInput.aTexCoord));
    vertexOutput.vTexCoord = decodedTexCoord * modelUniforms.uvScale + modelUniforms.uvOffset;
#endif

#ifdef HAS_AO_MAP
    let decodedTexCoord1 = decode_getTexcoord(vec2f(vertexInput.aTexCoord1));
    vertexOutput.vTexCoord1 = decodedTexCoord1 * modelUniforms.uvScale + modelUniforms.uvOffset;
#endif

#ifdef HAS_EXTRUSION_OPACITY
    vertexOutput.vExtrusionOpacity = vertexInput.aExtrusionOpacity;
#endif

#if HAS_COLOR
    vertexOutput.vColor = vertexInput.aColor / 255.0;
#elif HAS_COLOR0
#if COLOR0_SIZE == 3
    vertexOutput.vColor = vec4f(vertexInput.aColor0 / 255.0, 1.0);
#else
    vertexOutput.vColor = vertexInput.aColor0 / 255.0;
#endif
#endif

#if HAS_SHADOWING && !HAS_BLOOM
    shadow_computeShadowPars(localPositionMatrix * localPosition, &vertexOutput);
#endif

#ifdef HAS_I3S_UVREGION
    vertexOutput.vUvRegion = vertexInput.uvRegion / 65535.0;
#endif

#if HAS_HIGHLIGHT_OPACITY || HAS_HIGHLIGHT_COLOR
    highlight_setVarying(vertexInput, &vertexOutput);
#endif

#ifdef HAS_VERTEX_COLOR
    vertexColor_update(vertexInput, &vertexOutput);
#endif
    return vertexOutput;
}
