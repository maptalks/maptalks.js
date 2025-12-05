
#define AA_CLIP_LIMIT 2.0
#define AA_LINE_WIDTH 16.0

#define DEVICE_PIXEL_RATIO 1.0
#define ANTIALIASING 1.0 / 1.0 / 2.0

#define EXTRUDE_SCALE 63.0
#define EXTRUDE_MOD 64.0
#define MAX_LINE_DISTANCE 65535.0

struct LineUniforms {
    lineStrokeWidth: f32,
    positionMatrix: mat4x4f,
    projViewModelMatrix: mat4x4f,
    modelMatrix: mat4x4f,
    tileResolution: f32,
    tileRatio: f32,
    lineDx: f32,
    lineDy: f32,
    lineWidth: f32
};


struct ShaderUniforms {
    resolution: f32,
    cameraToCenterDistance: f32,
    canvasSize: vec2f,
    layerScale: f32,
    isRenderingTerrain: f32,
}

@group(0) @binding($b) var<uniform> uniforms: LineUniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;

struct VertexInput {
#ifdef HAS_ALTITUDE
    @location($i) aPosition: POSITION_TYPE_2,
    @location($i) aAltitude: f32,
#else
    @location($i) aPosition: POSITION_TYPE_3,
#endif

@location($i) aExtrude: vec4i,

#if HAS_PATTERN || HAS_DASHARRAY || HAS_GRADIENT || HAS_TRAIL
    @location($i) aLinesofar: LINESOFAR_TYPE,
#endif

#ifdef HAS_STROKE_WIDTH
    @location($i) aLineStrokeWidth: u32,
#endif

#if HAS_LINE_DX || HAS_LINE_DY
    @location($i) aLineDxDy: vec2i,
#endif

#ifdef USE_LINE_OFFSET
    @location($i) aExtrudeOffset: vec2f,
#endif

#ifdef HAS_LINE_WIDTH
    @location($i) aLineWidth: u32,
#endif

#ifndef PICKING_MODE
    #ifndef HAS_GRADIENT
        #ifdef HAS_COLOR
            @location($i) aColor: vec4u,
        #endif

        #ifdef HAS_PATTERN
            #if HAS_PATTERN_ANIM || HAS_PATTERN_GAP
                @location($i) aLinePattern: vec2i,
            #endif
                @location($i) aTexInfo: vec4u,
        #endif

        #ifdef HAS_DASHARRAY
            #ifdef HAS_DASHARRAY_ATTR
                @location($i) aDasharray: vec4u,
            #endif

            #ifdef HAS_DASHARRAY_COLOR
                @location($i) aDashColor: vec4u,
            #endif
        #endif
    #endif

    #ifdef HAS_STROKE_COLOR
        @location($i) aStrokeColor: vec4u,
    #endif

    #ifdef HAS_OPACITY
        @location($i) aOpacity: u32,
    #endif

    #ifdef HAS_GRADIENT
        @location($i) aGradIndex: u32,
    #endif
#endif
};

struct VertexOutput {
    @builtin(position) position: vec4f,
#ifndef PICKING_MODE
    @location($o) vNormal: vec2f,
    @location($o) vWidth: vec2f,
    @location($o) vGammaScale: f32,
#ifndef ENABLE_TILE_STENCIL
    @location($o) vPosition: vec2f,
#endif
    @location($o) vVertex: vec3f,

#if HAS_PATTERN || HAS_DASHARRAY || HAS_GRADIENT || HAS_TRAIL
    @location($o) vLinesofar: f32,
#endif


    #ifndef HAS_GRADIENT
        #ifdef HAS_COLOR
            @location($o) vColor: vec4f,
        #endif

        #ifdef HAS_PATTERN
            #ifdef HAS_PATTERN_ANIM
                @location($o) vLinePatternAnimSpeed: f32,
            #endif

            #ifdef HAS_PATTERN_GAP
                @location($o) vLinePatternGap: f32,
            #endif

            @location($o) vTexInfo: vec4f,
        #endif

        #ifdef HAS_DASHARRAY
            #ifdef HAS_DASHARRAY_ATTR
                @location($o) vDasharray: vec4f,
            #endif

            #ifdef HAS_DASHARRAY_COLOR
                @location($o) vDashColor: vec4f,
            #endif
        #endif
    #endif

    #ifdef HAS_STROKE_COLOR
        @location($o) vStrokeColor: vec4f,
    #endif

    #ifdef HAS_OPACITY
        @location($o) vOpacity: f32,
    #endif

    #ifdef HAS_GRADIENT
        @location($o) vGradIndex: f32,
    #endif
#else
#endif
};

#ifndef PICKING_MODE
    #if HAS_SHADOWING && !HAS_BLOOM
        #include <vsm_shadow_vert>
    #endif
#else
    #include <fbo_picking_vert>
#endif

#include <highlight_vert>

#include <vt_position_vert>

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let position = unpackVTPosition(input);

    // 牺牲了一些extrude的精度 (1/63)，把round和up存在extrude中
    let round = abs(f32(input.aExtrude.x)) % 2.0;
    let up = abs(f32(input.aExtrude.y)) % 2.0;
    //transfer up from (0 to 1) to (-1 to 1)
    let lineNormal = vec2f(round, up * 2.0 - 1.0);
    #ifndef PICKING_MODE
        output.vNormal = lineNormal;
    #endif

    let pos4 = vec4f(position, 1.0);
    let vertex = uniforms.projViewModelMatrix * uniforms.positionMatrix * pos4;
    #ifndef PICKING_MODE
        if (shaderUniforms.isRenderingTerrain == 1.0) {
            output.vVertex = (uniforms.positionMatrix * pos4).xyz;
        } else {
            output.vVertex = (uniforms.modelMatrix * uniforms.positionMatrix * pos4).xyz;
        }
    #endif

#ifdef HAS_STROKE_WIDTH
    let strokeWidth = f32(input.aLineStrokeWidth) / 2.0 * shaderUniforms.layerScale;
#else
    let strokeWidth = uniforms.lineStrokeWidth;
#endif

#ifdef HAS_LINE_WIDTH
    //除以2.0是为了解决 #190
    let myLineWidth = f32(input.aLineWidth) / 2.0 * shaderUniforms.layerScale;
#else
    let myLineWidth = uniforms.lineWidth * shaderUniforms.layerScale;
#endif
    let halfwidth = myLineWidth / 2.0 + strokeWidth;
    // offset = -1.0 * offset;

    let gapwidth = sign(strokeWidth) * myLineWidth / 2.0;
    let inset = gapwidth + sign(gapwidth) * ANTIALIASING;
    var outset = halfwidth + sign(halfwidth) * ANTIALIASING;

    // Scale the extrusion vector down to a normal and then up by the line width
    // of this vertex.
    let extrudeXY = vec2f(input.aExtrude.xy);
#ifdef USE_LINE_OFFSET
    let offset = lineOffset * (lineNormal.y * (extrudeXY - input.aExtrudeOffset) + input.aExtrudeOffset);
    var dist = (outset * extrudeXY + offset) / EXTRUDE_SCALE;
#else
    let extrude = extrudeXY / EXTRUDE_SCALE;
    var dist = outset * extrude;
#endif

    let resScale = uniforms.tileResolution / shaderUniforms.resolution;

    var localVertex = vec4f(position + vec3f(dist, 0.0) * uniforms.tileRatio / resScale, 1.0);
    output.position = uniforms.projViewModelMatrix * uniforms.positionMatrix * localVertex;

    // #284 解决倾斜大时的锯齿问题
    // if (shaderUniforms.isRenderingTerrain == 0.0) {
    //     let limit = min(AA_CLIP_LIMIT / shaderUniforms.canvasSize.x, AA_CLIP_LIMIT / shaderUniforms.canvasSize.y);
    //     let pixelDelta = distance(output.position.xy / output.position.w, vertex.xy / vertex.w) - limit;
    //     // * lineWidth 为了解决lineWidth为0时的绘制错误， #295
    //     if (pixelDelta * myLineWidth < 0.0) {
    //         // 绘制端点和原位置的间距太小，会产生锯齿，通过增加 dist 减少锯齿
    //         let pixelScale = -pixelDelta / limit;
    //         let aaWidth = pixelScale * pixelScale * pixelScale * pixelScale * AA_LINE_WIDTH;
    //         dist += aaWidth * extrude;
    //         outset += aaWidth / 6.0;
    //         // 用新的dist计算新的端点位置
    //         localVertex = vec4f(position + vec3f(dist, 0.0) * uniforms.tileRatio / resScale, 1.0);
    //         output.position = uniforms.projViewModelMatrix * uniforms.positionMatrix * localVertex;
    //     }
    // }

#ifdef HAS_LINE_DX
    let myLineDx = f32(input.aLineDxDy.x);
#else
    let myLineDx = uniforms.lineDx;
#endif
#ifdef HAS_LINE_DY
    let myLineDy = f32(input.aLineDxDy.y);
#else
    let myLineDy = uniforms.lineDy;
#endif

    //这里可能有z-fighting问题
    let projDistance = output.position.w;
    output.position.x += f32(myLineDx) * 2.0 / shaderUniforms.canvasSize.x * projDistance;
    output.position.y += f32(myLineDy) * 2.0 / shaderUniforms.canvasSize.y * projDistance;

#ifndef PICKING_MODE
    output.vWidth = vec2f(outset, inset);
    if (shaderUniforms.isRenderingTerrain == 1.0) {
        output.vGammaScale = 1.0;
    } else {
        output.vGammaScale = projDistance / shaderUniforms.cameraToCenterDistance;
    }
    #ifndef ENABLE_TILE_STENCIL
        output.vPosition = position.xy;
        #ifdef USE_LINE_OFFSET
            output.vPosition += uniforms.tileRatio * offset / EXTRUDE_SCALE;
        #endif
    #endif

    #if HAS_PATTERN || HAS_DASHARRAY || HAS_GRADIENT
        let aLinesofar = f32(input.aLinesofar);
        #ifdef HAS_GRADIENT
            output.vLinesofar = aLinesofar / MAX_LINE_DISTANCE;
            output.vGradIndex = f32(input.aGradIndex);
        #else
            // /resScale * tileRatio 是为了把像素宽度转换为瓦片内的值域(即tile extent 8192或4096)
            let linesofar = aLinesofar - halfwidth * f32(input.aExtrude.z) / EXTRUDE_SCALE / resScale * uniforms.tileRatio;
            output.vLinesofar = linesofar / uniforms.tileRatio * resScale;
        #endif
    #endif

    #ifndef HAS_GRADIENT
        #ifdef HAS_COLOR
            output.vColor = vec4f(input.aColor);
        #endif

        #ifdef HAS_DASHARRAY
            #ifdef HAS_DASHARRAY_ATTR
                output.vDasharray = vec4f(input.aDasharray);
            #endif

            #ifdef HAS_DASHARRAY_COLOR
                output.vDashColor = vec4f(input.aDashColor) / 255.0;
            #endif
        #endif

        #ifdef HAS_PATTERN
            output.vTexInfo = vec4f(vec2f(input.aTexInfo.xy), vec2f(input.aTexInfo.zw) + 1.0);
            #ifdef HAS_PATTERN_ANIM
                output.vLinePatternAnimSpeed = f32(input.aLinePattern.x) / 127.0;
            #endif

            #ifdef HAS_PATTERN_GAP
                output.vLinePatternGap = f32(input.aLinePattern.y) / 10.0;
            #endif
        #endif
    #endif

    #ifdef HAS_STROKE_COLOR
        output.vStrokeColor = vec4f(input.aStrokeColor);
    #endif

    #ifdef HAS_OPACITY
        output.vOpacity = f32(input.aOpacity) / 255.0;
    #endif

    #if HAS_SHADOWING && !HAS_BLOOM
        shadow_computeShadowPars(localVertex, &output);
    #endif
    #if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
        highlight_setVarying(input, output);
    #endif
#else
    fbo_picking_setData(input, &output, projDistance, true);
#endif

    return output;
}
