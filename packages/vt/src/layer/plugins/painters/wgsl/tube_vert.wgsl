#define EXTRUDE_SCALE 63.0
#define EXTRUDE_MOD 64.0
#define MAX_LINE_DISTANCE 65535.0

struct TubeUniforms {
    projViewModelMatrix: mat4x4f,
    positionMatrix: mat4x4f,
    centiMeterToLocal: vec2f,
    lineWidth: f32,
    modelViewMatrix: mat4x4f,
    modelNormalMatrix: mat3x3f,
    modelMatrix: mat4x4f,
    tileResolution: f32,
    tileRatio: f32,
};

struct TubeShaderUniforms {
    resolution: f32,


}

@group(0) @binding($b) var<uniform> uniforms: TubeUniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: TubeShaderUniforms;

struct VertexInput {
    #ifdef HAS_ALTITUDE
        @location($i) aPosition: POSITION_TYPE_2,
        @location($i) aAltitude: f32,
    #else
        @location($i) aPosition: POSITION_TYPE_3,
    #endif
    @location($i) aTubeNormal: vec4i,
    #ifdef HAS_LINE_WIDTH
        @location($i) aLineWidth: u32,
    #endif
    #ifdef HAS_PATTERN
        @location($i) aLinesofar: u32,
        @location($i) aTexInfo: vec4u,
        @location($i) aNormalDistance: i32,
        #if HAS_PATTERN_ANIM
            @location($i) aLinePatternAnimSpeed: i32,
        #endif
        #if HAS_PATTERN_GAP
            @location($i) aLinePatternGap: i32,
        #endif
    #endif
    #ifdef HAS_COLOR
        @location($i) aColor: vec4u,
    #endif
    #ifdef HAS_OPACITY
        @location($i) aOpacity: u32,
    #endif
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    #ifndef PICKING_MODE
        @location($o) vModelNormal: vec3f,
        @location($o) vViewVertex: vec4f,
        @location($o) vModelVertex: vec3f,
        #ifdef HAS_COLOR
            @location($o) vColor: vec4f,
        #endif
        @location($o) vOpacity: f32,
        #ifdef HAS_PATTERN
            @location($o) vLinesofar: f32,
            @location($o) vTexInfo: vec4f,
            @location($o) vNormalY: f32,
            @location($o) vPatternHeight: f32,
            #if HAS_PATTERN_ANIM
                @location($o) vLinePatternAnimSpeed: f32,
            #endif
            #if HAS_PATTERN_GAP
                @location($o) vLinePatternGap: f32,
            #endif
        #endif
    #endif
};

#include <vt_position_vert>

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#else
    #if HAS_SHADOWING && !HAS_BLOOM
        #include <vsm_shadow_vert>
    #endif
#endif

#include <highlight_vert>

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    #ifdef HAS_LINE_WIDTH
        let myLineWidth = input.aLineWidth;
    #else
        let myLineWidth = uniforms.lineWidth;
    #endif

    let halfwidth = myLineWidth / 2.0;
    let tubeNormal = vec3f(input.aTubeNormal.xyz) / EXTRUDE_SCALE;
    let position = unpackVTPosition(input);
    var localVertex = vec4f(position, 1.0);
    let dxy = tubeNormal.xy * halfwidth * uniforms.centiMeterToLocal;
    let dz = tubeNormal.z * halfwidth;
    localVertex = vec4f(localVertex.xy + dxy, localVertex.z + dz, localVertex.w);
    output.position = uniforms.projViewModelMatrix * localVertex;

    #ifdef PICKING_MODE
        fbo_picking_setData(output.position.w, true);
    #else
        output.vViewVertex = uniforms.modelViewMatrix * localVertex;
        let localNormal = normalize(tubeNormal);
        output.vModelNormal = uniforms.modelNormalMatrix * localNormal;
        output.vModelVertex = (uniforms.modelMatrix * localVertex).xyz;

        #if HAS_SHADOWING && !HAS_BLOOM
            shadow_computeShadowPars(localVertex);
        #endif

        #ifdef HAS_COLOR
            output.vColor = vec4f(input.aColor) / 255.0;
        #endif

        #ifdef HAS_OPACITY
            output.vOpacity = f32(input.aOpacity) / 255.0;
        #else
            output.vOpacity = 1.0;
        #endif

        #ifdef HAS_PATTERN
            let scale = uniforms.tileResolution / shaderUniforms.resolution;
            #ifdef HAS_ALTITUDE
                let linesofar = f32(input.aLinesofar) - halfwidth * uniforms.centiMeterToLocal.y * f32(input.aNormalDistance) / EXTRUDE_SCALE;
            #else
                let linesofar = f32(input.aLinesofar);
            #endif
            output.vLinesofar = linesofar / uniforms.tileRatio * scale;
            output.vTexInfo = vec4f(vec2f(input.aTexInfo.xy), vec2f(input.aTexInfo.zw) + 1.0);
            output.vPatternHeight = myLineWidth * uniforms.centiMeterToLocal.x / uniforms.tileRatio * scale;
            output.vNormalY = f32(input.aTubeNormal.w) / EXTRUDE_SCALE;

            #if HAS_PATTERN_ANIM
                output.vLinePatternAnimSpeed = input.aLinePatternAnimSpeed / 127.0;
            #endif

            #if HAS_PATTERN_GAP
                output.vLinePatternGap = f32(input.aLinePatternGap) / 10.0;
            #endif
        #endif
        #if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
            highlight_setVarying(input, output);
        #endif
    #endif

    return output;
}
