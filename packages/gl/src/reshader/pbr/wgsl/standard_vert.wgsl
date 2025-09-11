#include <highlight_vert>
#include <line_extrusion_vert>
#include <get_output>
#include <vsm_shadow_vert>

#include <vertex_color_vert>
#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif
#include <excavate_vert>
#include <common_pack_float>

struct VertexInput {
    #ifdef POSITION_IS_INT
        @location($i) aPosition: vec4i,
    #else
        @location($i) aPosition: vec3f,
    #endif

    #if HAS_MAP || HAS_TERRAIN_FLAT_MASK
        @location($i) aTexCoord: vec2f,
    #endif
    #if HAS_MAP

        #ifdef HAS_I3S_UVREGION
            @location($i) uvRegion: vec4f,
        #endif
        #if HAS_AO_MAP
            @location($i) aTexCoord1: vec2f,
        #endif
    #endif

    #if HAS_COLOR
        @location($i) aColor: vec4u,
    #endif

    #ifdef HAS_OPACITY
        @location($i) aOpacity: f32,
    #endif

    #if HAS_COLOR0
        #if COLOR0_SIZE == 3
            @location($i) aColor0: vec3u,
        #else
            @location($i) aColor0: vec4u,
        #endif
    #endif

    #if HAS_TANGENT || HAS_NORMAL
        #ifdef NORMAL_IS_INT
            @location($i) aNormal: vec4i,
        #else
            @location($i) aNormal: vec3f,
        #endif
        #if HAS_TANGENT
            @location($i) aTangent: vec4f,
        #endif
    #endif
}

struct VertexOutput {
    @builtin(position) position: vec4f,

    #ifdef HAS_SSR
        @location($o) vViewNormal: vec3f,
        #ifdef HAS_TANGENT
            @location($o) vViewTangent: vec4f,
        #endif
    #endif

    @location($o) vModelNormal: vec3f,
    @location($o) vViewVertex: vec4f,

    #if HAS_TANGENT
        @location($o) vModelTangent: vec4f,
        @location($o) vModelBiTangent: vec3f,
    #endif

    @location($o) vModelVertex: vec3f,

    #if HAS_MAP
        @location($o) vTexCoord: vec2f,
        #ifdef HAS_AO_MAP
            @location($o) vTexCoord1: vec2f,
        #endif
        #ifdef HAS_I3S_UVREGION
            @location($o) vUvRegion: vec4f,
        #endif
    #endif

    #if HAS_COLOR
        @location($o) vColor: vec4f,
    #endif

        @location($o) vOpacity: f32,

    #if HAS_COLOR0
        @location($o) vColor0: vec4f,
    #endif

    #if HAS_BUMP_MAP && HAS_TANGENT
        @location($o) vTangentViewPos: vec3f,
        @location($o) vTangentFragPos: vec3f,
    #endif
}


struct ShaderUniforms {
    cameraPosition: vec3f,
    projMatrix: mat4x4f,
}

struct Uniforms {
    uvOrigin: vec2f,
    uvScale: vec2f,
    uvOffset: vec2f,
    uvRotation: f32,
    modelMatrix: mat4x4f,
    modelViewMatrix: mat4x4f,
    positionMatrix: mat4x4f,
    modelNormalMatrix: mat3x3f,
    #ifdef HAS_SSR
        modelViewNormalMatrix: mat3x3f,
    #endif
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;

var<private> Vertex: vec3f;
var<private> Normal: vec3f;
var<private> Tangent: vec4f;

const mid = 0.5;

fn toTangentFrame(q: vec4f) -> vec3f {
    return vec3f(0.0, 0.0, 1.0) +
           vec3f(2.0, -2.0, -2.0) * q.x * q.zwx +
           vec3f(2.0, 2.0, -2.0) * q.y * q.wzy;
}

struct TangentFrame {
    n: vec3f,
    t: vec3f
}

fn toTangentFrameWithTangent(q: vec4f) -> TangentFrame {
    var out: TangentFrame;
    out.n = toTangentFrame(q);
    out.t = vec3f(1.0, 0.0, 0.0) +
             vec3f(-2.0, 2.0, -2.0) * q.y * q.yxw +
             vec3f(-2.0, 2.0, 2.0) * q.z * q.zwx;
    return out;
}

fn rotateUV(uv: vec2f, rotation: f32) -> vec2f {
    return vec2f(
        cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
        cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
    );
}

#if HAS_MAP
fn transformTexcoord(uv: vec2f) -> vec2f {
    let decodedTexCoord = decode_getTexcoord(uv);
    #ifdef HAS_RANDOM_TEX
        let origin = uniforms.uvOrigin;
        let texCoord = decodedTexCoord * uniforms.uvScale + uniforms.uvOffset;
        return (origin % 1.0) + texCoord;
    #else
        let origin = uniforms.uvOrigin;
        let texCoord = decodedTexCoord * uniforms.uvScale;
        if (uniforms.uvRotation != 0.0) {
            origin = rotateUV(origin, uniforms.uvRotation);
            texCoord = rotateUV(texCoord, uniforms.uvRotation);
        }
        return (origin % 1.0) + texCoord + uniforms.uvOffset;
    #endif
}
#endif

fn transposeMat3(inMat: mat3x3f) -> mat3x3f {
    let i0 = inMat[0];
    let i1 = inMat[1];
    let i2 = inMat[2];

    return mat3x3f(
        vec3f(i0.x, i1.x, i2.x),
        vec3f(i0.y, i1.y, i2.y),
        vec3f(i0.z, i1.z, i2.z)
    );
}


@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    let localPositionMatrix = getPositionMatrix(input, &output, uniforms.positionMatrix);

    #ifdef IS_LINE_EXTRUSION
        let linePosition = getLineExtrudePosition(vec3f(input.aPosition.xyz), input);
        let localVertex = getPosition(linePosition, input);
    #else
        let localVertex = getPosition(vec3f(input.aPosition.xyz), input);
    #endif

    output.vModelVertex = (uniforms.modelMatrix * localVertex).xyz;

    let position = localPositionMatrix * localVertex;
    let viewVertex = uniforms.modelViewMatrix * position;
    output.vViewVertex = viewVertex;

    #ifdef HAS_MASK_EXTENT
        output.position = shaderUniforms.projMatrix * getMaskPosition(position, uniforms.modelMatrix);
    #else
        output.position = shaderUniforms.projMatrix * viewVertex;
    #endif

    #ifdef PICKING_MODE
        var alpha = 1.0;
        #if HAS_COLOR
            alpha *= f32(input.aColor.a);
        #endif
        #if HAS_COLOR0 && COLOR0_SIZE == 4
            alpha *= f32(input.aColor0.a);
        #endif

        fbo_picking_setData(vertex, &output, output.position.w, alpha != 0.0);
    #else
        #if HAS_MAP
            output.vTexCoord = transformTexcoord(input.aTexCoord);
            #ifdef HAS_AO_MAP
                output.vTexCoord1 = transformTexcoord(input.aTexCoord1);
            #endif
            #ifdef HAS_I3S_UVREGION
                output.vUvRegion = input.uvRegion / 65535.0;
            #endif
        #endif

        #if HAS_TANGENT || HAS_NORMAL
            let positionNormalMatrix = mat3x3f(
                localPositionMatrix[0].xyz,
                localPositionMatrix[1].xyz,
                localPositionMatrix[2].xyz
            );
            let normalMatrix = uniforms.modelNormalMatrix * positionNormalMatrix;
            #if HAS_TANGENT
                let tangentFrame = toTangentFrameWithTangent(input.aTangent);
                Normal = tangentFrame.n;
                let t = tangentFrame.t;
                output.vModelTangent = vec4f(normalMatrix * t, input.aTangent.w);
            #else
                Normal = decode_getNormal(vec3f(input.aNormal.xyz));
            #endif
            let localNormal = Normal;
            output.vModelNormal = normalMatrix * localNormal;
        #else
            Normal = vec3f(0);
            output.vModelNormal = vec3f(0);
        #endif

        #if HAS_TANGENT
            output.vModelBiTangent = cross(output.vModelNormal, output.vModelTangent.xyz) * sign(input.aTangent.w);
        #endif

        #ifdef HAS_SSR
            let ssrNormalMatrix = uniforms.modelViewNormalMatrix * positionNormalMatrix;
            output.vViewNormal = ssrNormalMatrix * Normal;
            #if HAS_TANGENT
                let localTangent = vec4f(t, input.aTangent.w);
                output.vViewTangent = vec4f(ssrNormalMatrix * localTangent.xyz, localTangent.w);
            #endif
        #endif

        #if HAS_COLOR
            output.vColor = vec4f(input.aColor) / 255.0;
        #endif

        #ifdef HAS_OPACITY
            output.vOpacity = input.aOpacity / 255.0;
        #else
            output.vOpacity = 1.0;
        #endif

        #if HAS_HIGHLIGHT_OPACITY || HAS_HIGHLIGHT_COLOR
            highlight_setVarying(input, &output);
        #endif

        #if HAS_COLOR0
            #if COLOR0_SIZE == 3
                output.vColor0 = vec4f(vec3f(input.aColor0), 255.0) / 255.0;
            #else
            output.vColor0 = vec4f(input.aColor0) / 255.0;
            #endif
        #endif

        #if HAS_SHADOWING && !HAS_BLOOM
            shadow_computeShadowPars(position);
        #endif

        #if HAS_BUMP_MAP && HAS_TANGENT
            let TBN = transposeMat3(mat3x3f(output.vModelTangent.xyz, output.vModelBiTangent, output.vModelNormal));
            output.vTangentViewPos = TBN * shaderUniforms.cameraPosition;
            output.vTangentFragPos = TBN * output.vModelVertex;
        #endif

        #ifdef HAS_VERTEX_COLOR
            vertexColor_update(input, &output);
        #endif

        #ifdef HAS_EXCAVATE_ANALYSIS
            output.vCoordinateTexcoord = getCoordinateTexcoord(position, uniforms.modelMatrix);
            output.vExcavateHeight = getWorldHeight(position, uniforms.modelMatrix);
        #endif
    #endif

    return output;
}
