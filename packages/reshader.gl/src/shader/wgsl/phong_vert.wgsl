// ds魔法 请把下面的glsl代码转为wgsl，要求保留#开头的宏处理语句内的代码，变量名维持不变，非texture_2d和sampler类型的uniform变量放到一个struct中：
struct VertexInput {
    @location($i) aPosition: vec3f,
#ifdef HAS_MAP
    @location($i) aTexCoord: vec2f,
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
    @location($i) aNormal: vec3f,
#endif
// 动态插入include中定义的attributes
};

struct VertexOutput {
    @builtin(position) Position : vec4f,
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
#ifdef HAS_EXTRUSION_OPACITY
    @location($o) vExtrusionOpacity: f32,
#endif
#ifdef HAS_TANGENT
    @location($o) vTangent: vec4f,
#endif
// 动态插入include中定义的varyings
};

struct MatrixUniforms {
    projMatrix: mat4x4f,
    modelNormalMatrix: mat3x3f,
    modelViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
    projViewMatrix: mat4x4f,
};

struct UvUniforms {
    uvScale: vec2f,
    uvOffset: vec2f,
};

struct JitterUniforms {
    halton: vec2f,
    outSize: vec2f,
};

@group(0) @binding($b) var<uniform> uniforms: MatrixUniforms;
@group(0) @binding($b) var<uniform> uvUniforms: UvUniforms;
@group(0) @binding($b) var<uniform> jitterUniforms: JitterUniforms;

#include <line_extrusion_vert>
#include <highlight_vert>
#include <get_output>

#if HAS_SHADOWING && !HAS_BLOOM
#include <vsm_shadow_vert>
#endif
#include <vertex_color_vert>

fn toTangentFrame(q: vec4f) -> vec3f {
    return vec3f(0.0, 0.0, 1.0) +
           vec3f(2.0, -2.0, -2.0) * q.x * q.zwx +
           vec3f(2.0, 2.0, -2.0) * q.y * q.wzy;
}

fn toTangentFrame(q: vec4f, n: ptr<function, vec3f>, t: ptr<function, vec3f>) {
    *n = toTangentFrame(q);
    *t = vec3f(1.0, 0.0, 0.0) +
         vec3f(-2.0, 2.0, -2.0) * q.y * q.yxw +
         vec3f(-2.0, 2.0, 2.0) * q.z * q.zwx;
}

@vertex
fn main(vertexInput: VertexInput, vertexOutput: VertexOutput) {
#ifdef IS_LINE_EXTRUSION
    let localPosition = getPosition(getLineExtrudePosition(vertexInput.aPosition));
#else
    let localPosition = getPosition(vertexInput.aPosition);
#endif
    let localPositionMatrix = getPositionMatrix();

    vertexOutput.vFragPos = (uniforms.modelMatrix * localPositionMatrix * localPosition).xyz;

#if defined(HAS_NORMAL) || defined(HAS_TANGENT)
    let localNormalMatrix = uniforms.modelNormalMatrix * mat3x3f(localPositionMatrix);
    var Normal: vec3f;
#if defined(HAS_TANGENT)
    var t: vec3f;
    toTangentFrame(vertexInput.aTangent, Normal, t);
    vertexOutput.vTangent = vec4f(localNormalMatrix * t, vertexInput.aTangent.w);
#else
    Normal = decode_getNormal(vertexInput.aNormal);
#endif
    let localNormal = appendMorphNormal(Normal);
    vertexOutput.vNormal = normalize(localNormalMatrix * localNormal);
#else
    vertexOutput.vNormal = vec3f(0.0);
#endif

    var jitteredProjection = uniforms.projMatrix;
    jitteredProjection[2].xy += jitterUniforms.halton.xy / jitterUniforms.outSize.xy;

#ifdef HAS_MASK_EXTENT
    vertexOutput.gl_Position = jitteredProjection * getMaskPosition(localPositionMatrix * localPosition, uniforms.modelMatrix);
#else
    vertexOutput.gl_Position = jitteredProjection * uniforms.modelViewMatrix * localPositionMatrix * localPosition;
#endif

#ifdef HAS_MAP
    let decodedTexCoord = decode_getTexcoord(vertexInput.aTexCoord);
    vertexOutput.vTexCoord = decodedTexCoord * uvUniforms.uvScale + uvUniforms.uvOffset;
#endif

#ifdef HAS_AO_MAP
    let decodedTexCoord1 = decode_getTexcoord(vertexInput.aTexCoord1);
    vertexOutput.vTexCoord1 = decodedTexCoord1 * uvUniforms.uvScale + uvUniforms.uvOffset;
#endif

#ifdef HAS_EXTRUSION_OPACITY
    vertexOutput.vExtrusionOpacity = vertexInput.aExtrusionOpacity;
#endif

#if defined(HAS_COLOR)
    vertexOutput.vColor = vertexInput.aColor / 255.0;
#elif defined(HAS_COLOR0)
#if COLOR0_SIZE == 3
    vertexOutput.vColor = vec4f(vertexInput.aColor0 / 255.0, 1.0);
#else
    vertexOutput.vColor = vertexInput.aColor0 / 255.0;
#endif
#endif

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    shadow_computeShadowPars(localPositionMatrix * localPosition);
#endif

#ifdef HAS_I3S_UVREGION
    vertexOutput.vUvRegion = vertexInput.uvRegion / 65535.0;
#endif

    highlight_setVarying();

#ifdef HAS_VERTEX_COLOR
    vertexColor_update();
#endif
    return vertexOutput;
}
