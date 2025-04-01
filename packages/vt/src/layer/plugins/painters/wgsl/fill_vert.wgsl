#define SHADER_NAME FILL
struct VertexInput {
#ifdef HAS_ALTITUDE
    @location($i) aPosition: vec2i,
    @location($i) aAltitude: f32,
#else
    @location($i) aPosition: vec4i,
#endif
#ifdef HAS_COLOR
    @location($i) aColor: vec4f,
#endif
#ifdef HAS_OPACITY
    @location($i) aOpacity: f32,
#endif
#ifdef HAS_PATTERN
    #ifdef HAS_TEX_COORD
        @location($i) aTexCoord: vec2f,
    #endif
    @location($i) aTexInfo: vec4u,
#endif
#ifdef HAS_UV_SCALE
    @location($i) aUVScale: vec2f,
#endif
#ifdef HAS_UV_OFFSET
    @location($i) aUVOffset: vec2f,
#endif
#ifdef HAS_PATTERN_WIDTH
    @location($i) aPatternWidth: vec2f,
#endif
#ifdef HAS_PATTERN_ORIGIN
    @location($i) aPatternOrigin: vec2f,
#endif
#ifdef HAS_PATTERN_OFFSET
    @location($i) aPatternOffset: vec2f,
#endif
}

struct VertexOutput {
    @builtin(position) position : vec4f,
#ifdef HAS_PATTERN
    @location($o) vTexCoord: vec2f,
    @location($o) vTexInfo: vec4f,
#endif
#ifdef HAS_COLOR
    @location($o) vColor: vec4f,
#endif
#ifdef HAS_OPACITY
    @location($o) vOpacity: f32,
#endif
#ifdef HAS_UV_SCALE
    @location($o) vUVScale: vec2f,
#endif
#ifdef HAS_UV_OFFSET
    @location($o) vUVOffset: vec2f,
#endif
}

struct ModelUniforms {
    projViewModelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
#ifdef IS_VT
#else
    modelMatrix: mat4x4f,
#endif
#ifdef HAS_PATTERN
    patternWidth: vec2f,
    patternOffset: vec2f,
    uvOrigin: vec2f,
    uvScale: vec2f,
#ifdef IS_VT
    tileRatio: f32,
    tileScale: f32,
#else
    glScale: f32,
#endif
#endif
};
#ifdef HAS_PATTERN && IS_VT
#else
struct Uniforms {
    glScale: f32,
}
#endif

@group(0) @binding($b) var<uniform> uniforms: ModelUniforms;
#ifdef HAS_PATTERN && IS_VT
#else
@group(0) @binding($b) var<uniform> shaderUniforms: Uniforms;
#endif

#ifdef HAS_PATTERN
    fn computeUV(vertex: vec2f, patternWidth: vec2f) -> vec2f {
        #ifdef IS_VT
            let u = vertex.x / patternWidth.x;
            let v = vertex.y / patternWidth.y;
            return vec2f(u, v);
        #else
            let glScale = shaderUniforms.glScale;
            var mapGLScale = glScale;
            #ifdef HAS_PATTERN_WIDTH
                let hasPatternWidth = sign(length(aPatternWidth));
                mapGLScale = mix(glScale, 1.0, hasPatternWidth);
            #endif
            var origin = uniforms.uvOrigin;
            #ifdef HAS_PATTERN_ORIGIN
                origin = aPatternOrigin;
            #endif
            #ifdef HAS_PATTERN_OFFSET
                let myPatternOffset = aPatternOffset;
            #else
                let myPatternOffset = uniforms.patternOffset;
            #endif
            origin += myPatternOffset;
            let u = (vertex.x - origin.x) * mapGLScale / patternWidth.x;
            let v = (vertex.y - origin.y) * mapGLScale / patternWidth.y;
            return vec2f(u, -v);
        #endif
    }

    fn computeTexCoord(localVertex: vec4f, patternSize: vec2f) -> vec2f {
        #ifdef IS_VT
            #ifdef HAS_PATTERN_OFFSET
                let myPatternOffset = aPatternOffset;
            #else
                let myPatternOffset = uniforms.patternOffset;
            #endif
            var origin = uniforms.uvOrigin + myPatternOffset;
            #ifdef HAS_PATTERN_ORIGIN
                origin = origin - aPatternOrigin * uniforms.tileScale;
            #endif
            let hasPatternWidth = sign(length(uniforms.patternWidth));
            var myPatternWidth = mix(patternSize, uniforms.patternWidth, hasPatternWidth);
            #ifdef HAS_PATTERN_WIDTH
                myPatternWidth = aPatternWidth;
            #endif
            let originOffset = origin * vec2f(1.0, -1.0) / myPatternWidth;
            return (originOffset % 1.0) + computeUV(localVertex.xy * uniforms.tileScale / uniforms.tileRatio, myPatternWidth);
        #else
            var myPatternWidth = patternSize;
            #ifdef HAS_PATTERN_WIDTH
                let hasPatternWidth = sign(length(aPatternWidth));
                myPatternWidth = mix(patternSize, aPatternWidth, hasPatternWidth);
            #endif
            let position = uniforms.modelMatrix * localVertex;
            return computeUV(position.xy, myPatternWidth);
        #endif
    }
#endif

#if HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_vert>
#endif

#include <vt_position_vert>
#include <highlight_vert>

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    let myPosition = unpackVTPosition(vertexInput);
    let localVertex = vec4f(myPosition, 1.0);
    var out: VertexOutput;
    var position = uniforms.projViewModelMatrix * uniforms.positionMatrix * localVertex;
    out.position = position;

    #ifdef HAS_PATTERN
        let aTexInfo: vec4f = vec4f(vertexInput.aTexInfo);
        let patternSize = aTexInfo.zw + 1.0;
        out.vTexInfo = vec4f(aTexInfo.xy, patternSize);
        #ifdef HAS_TEX_COORD
            if (vertexInput.aTexCoord.x == INVALID_TEX_COORD) {
                out.vTexCoord = computeTexCoord(localVertex, patternSize);
            } else {
                out.vTexCoord = vertexInput.aTexCoord;
            }
        #else
            out.vTexCoord = computeTexCoord(localVertex, patternSize);
        #endif

        #ifdef HAS_UV_SCALE
            out.vUVScale = vertexInput.aUVScale / 255.0;
        #endif
        #ifdef HAS_UV_OFFSET
            out.vUVOffset = vertexInput.aUVOffset / 255.0;
        #endif
    #endif

    #ifdef HAS_COLOR
        out.vColor = vertexInput.aColor / 255.0;
    #endif

    #if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
        highlight_setVarying(vertexInput, out);
    #endif

    #ifdef HAS_OPACITY
        out.vOpacity = vertexInput.aOpacity / 255.0;
    #endif

    #if HAS_SHADOWING && !HAS_BLOOM
        shadow_computeShadowPars(localVertex);
    #endif

    return out;
}
