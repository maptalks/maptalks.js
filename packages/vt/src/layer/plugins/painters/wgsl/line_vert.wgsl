
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
    lineWidth: f32,
    lineOffset: f32,
    // 同一几何的多个 symbol（如线宽10描边 + 线宽8主线）被拆成多个独立 mesh 绘制，它们完全共面，
    // 深度只差浮点噪声，倾斜视角下会 z-fighting 闪烁。
    // lineDepthBias 为按 symbol 绘制序号递增的 NDC 深度偏置，使后绘制（上层）的线确定性地靠近相机。
    lineDepthBias: f32
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

#ifdef HAS_LINES_STORAGE
// line fn-type 动态属性按 feature 打包的只读 storage 记录。
// 记录布局必须与 vt 端 line_fn_storage.js（FN_STRIDE/FN_OFFSET）保持一致：
// word0 color(rgba), word1 width(u8), word2 opacity(u8), word3 strokeWidth(u8),
// word4 strokeColor(rgba), word5 lineOffset(int32位模式), word6 dxdy(i8x2), word7 pattern(i8x2)
struct LineFnRecords {
    records: array<u32>,
};
@group(0) @binding($b) var<storage, read> lineFnRecords: LineFnRecords;
#endif

struct VertexInput {
#ifdef HAS_ALTITUDE
    @location($i) aPosition: POSITION_TYPE_2,
    @location($i) aAltitude: f32,
#else
    @location($i) aPosition: POSITION_TYPE_3,
#endif
#if HAS_PATTERN || HAS_DASHARRAY
    @location($i) aExtrude: vec4i,
#else
    @location($i) aExtrude: vec2i,
#endif

#if HAS_PATTERN || HAS_DASHARRAY || HAS_GRADIENT || HAS_TRAIL
    @location($i) aLinesofar: LINESOFAR_TYPE,
#endif

#ifdef HAS_STROKE_WIDTH
    #ifndef HAS_LINES_STORAGE
        @location($i) aLineStrokeWidth: u32,
    #endif
#endif

#if HAS_LINE_DX || HAS_LINE_DY
    #ifndef HAS_LINES_STORAGE
        @location($i) aLineDxDy: vec2i,
    #endif
#endif

#ifdef HAS_LINE_WIDTH
    #ifndef HAS_LINES_STORAGE
        @location($i) aLineWidth: u32,
    #endif
#endif

#ifdef HAS_LINE_OFFSET
    #ifndef HAS_LINES_STORAGE
        @location($i) aLineOffset: i32,
    #endif
    // round帽(线端半圆帽)顶点：所在线段单位法向(EXTRUDE_SCALE倍)，供帽顶点刚性平移；非帽顶点为0
    @location($i) aCapOffset: vec2i,
#endif

#ifndef PICKING_MODE
    #ifndef HAS_GRADIENT
        #ifdef HAS_COLOR
            #ifndef HAS_LINES_STORAGE
                @location($i) aColor: vec4u,
            #endif
        #endif

        #ifdef HAS_PATTERN
            #if HAS_PATTERN_ANIM || HAS_PATTERN_GAP
                #ifndef HAS_LINES_STORAGE
                    @location($i) aLinePattern: vec2i,
                #endif
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
        #ifndef HAS_LINES_STORAGE
            @location($i) aStrokeColor: vec4u,
        #endif
    #endif

    #ifdef HAS_OPACITY
        #ifndef HAS_LINES_STORAGE
            @location($i) aOpacity: u32,
        #endif
    #endif

    #ifdef HAS_GRADIENT
        @location($i) aGradIndex: u32,
    #endif

    #ifdef HAS_LINES_STORAGE
        // storage 模式下 fn 动态属性已打包进只读 storage buffer（不占用顶点 buffer 名额），
        // 顶点只提供其所属 feature 的序号 aPickingId，作为 lineFnRecords 的下标。
        // PICKING_MODE 编译中该属性由 <fbo_picking_vert> include 注入，这里无需重复声明
        @location($i) aPickingId: f32,
    #endif
#endif

#ifdef HAS_LINE_DEPTH_BIAS
    // vector渲染中同一条线的多symbol被合并进同一顶点缓冲，这里按feature（symbol顺序）存放NDC深度偏置
    @location($i) aLineDepthBias: f32,
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

    // 地形皮肤模式下projViewMatrix为单位矩阵，vertex.w与cameraToCenterDistance不在同一坐标系，
    // 因此地形模式继续使用顶点深度与地面投影点深度的比值来补偿线宽
    // 非地形模式下，使用相机深度比例缩放挤出偏移量，使线宽在屏幕上保持恒定像素宽度
    // vertex.w是裁剪空间W值(视图空间深度)，cameraToCenterDistance是相机到视图中心的距离
    // 挤出偏移量乘以vertex.w/cameraToCenterDistance后，透视投影的1/w效应被抵消，线宽不再随深度近大远小
    // 该比例同时隐式补偿了顶点高程：有高程的顶点vertex.w更小，缩放更小，线宽与地面线保持一致
    var widthScale: f32;
    if (shaderUniforms.isRenderingTerrain == 1.0) {
        let groundVertex = uniforms.projViewModelMatrix * uniforms.positionMatrix * vec4f(position.xy, 0.0, 1.0);
        widthScale = vertex.w / groundVertex.w;
    } else {
        // 线延伸到相机后方时该顶点vertex.w为负，若直接相除widthScale变负，会使挤出方向翻转
        // 且vWidth变负导致片元中描边/芯线分层错乱；相机后方的几何最终被近平面裁剪，
        // 这里钳制为0，只让线在越过相机的交界处平滑收拢到中心线，不再产生颜色翻转
        widthScale = max(vertex.w, 0.0) / shaderUniforms.cameraToCenterDistance;
    }

#ifdef HAS_LINES_STORAGE
    // 逐 feature 记录读取：同一 feature 的 fn 动态属性取值相同，打包成一条记录。
    // 记录布局必须与 vt 端 line_fn_storage.js 的 FN_STRIDE/FN_OFFSET 保持一致（每条 8 个 u32）：
    // word0 color(rgba), word1 width(u8), word2 opacity(u8), word3 strokeWidth(u8),
    // word4 strokeColor(rgba), word5 lineOffset(int32位模式), word6 dxdy(i8x2), word7 pattern(i8x2)
    let recBase = u32(input.aPickingId) * 8u;
    let recColorWord = lineFnRecords.records[recBase + 0u];
    let recWidth = lineFnRecords.records[recBase + 1u] & 0xffu;
    let recOpacity = lineFnRecords.records[recBase + 2u] & 0xffu;
    let recStrokeWidth = lineFnRecords.records[recBase + 3u] & 0xffu;
    let recStrokeColorWord = lineFnRecords.records[recBase + 4u];
    // lineOffset 存的是 Int16 的 int32 位模式，按位还原为有符号值
    let recLineOffset = bitcast<i32>(lineFnRecords.records[recBase + 5u]);
    // dx/dy、pattern 各占低/高 8 位，用左移再算术右移做 int8 符号扩展
    let recDxDyWord = bitcast<i32>(lineFnRecords.records[recBase + 6u]);
    let recDx = (recDxDyWord << 24) >> 24;
    let recDy = (recDxDyWord << 16) >> 24;
    let recPatternWord = bitcast<i32>(lineFnRecords.records[recBase + 7u]);
    let recPatternAnimSpeed = (recPatternWord << 24) >> 24;
    let recPatternGap = (recPatternWord << 16) >> 24;
    // 颜色按 bit24-31 r / bit16-23 g / bit8-15 b / bit0-7 a 还原成 vec4u
    let recColor = vec4u((recColorWord >> 24u) & 0xffu, (recColorWord >> 16u) & 0xffu, (recColorWord >> 8u) & 0xffu, recColorWord & 0xffu);
    let recStrokeColor = vec4u((recStrokeColorWord >> 24u) & 0xffu, (recStrokeColorWord >> 16u) & 0xffu, (recStrokeColorWord >> 8u) & 0xffu, recStrokeColorWord & 0xffu);
#endif

#ifdef HAS_STROKE_WIDTH
    #ifdef HAS_LINES_STORAGE
        let strokeWidth = f32(recStrokeWidth) / 2.0 * shaderUniforms.layerScale;
    #else
        let strokeWidth = f32(input.aLineStrokeWidth) / 2.0 * shaderUniforms.layerScale;
    #endif
#else
    let strokeWidth = uniforms.lineStrokeWidth;
#endif

#ifdef HAS_LINE_WIDTH
    #ifdef HAS_LINES_STORAGE
        //除以2.0是为了解决 #190
        let myLineWidth = f32(recWidth) / 2.0 * shaderUniforms.layerScale;
    #else
        //除以2.0是为了解决 #190
        let myLineWidth = f32(input.aLineWidth) / 2.0 * shaderUniforms.layerScale;
    #endif
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
    // lineOffset（像素）：为线增加一个沿自身法向（垂直于线方向）的偏移，
    // 偏移后的线整体平移在原来线的一侧，正值向线行进方向的右侧偏移，负值向左。
    // 上下两半顶点分别增减 offset，等价于把整条带宽刚性平移到法向一侧，
    // miter 顶点因 extrude 自带 miterLength 倍率，顶点位移自动放大，保证偏移后 join 依然闭合。
    let extrude = extrudeXY / EXTRUDE_SCALE;
    // 常量 lineOffset 走 uniform 方式的 USE_LINE_OFFSET；storage 模式下取值已打包进 records，
    // 从 records 读取，避免回退到 WebGPU 顶点阶段不可靠的动态 uniform
    #ifdef HAS_LINES_STORAGE
        let lineOffsetDist = f32(recLineOffset) * lineNormal.y * extrude;
    #else
        let lineOffsetDist = uniforms.lineOffset * lineNormal.y * extrude;
    #endif
    var dist = outset * extrude + lineOffsetDist;
#else
    #ifdef HAS_LINE_OFFSET
        let extrude = extrudeXY / EXTRUDE_SCALE;
        #ifdef HAS_LINES_STORAGE
            let lineOffsetValue = f32(recLineOffset);
        #else
            let lineOffsetValue = f32(input.aLineOffset);
        #endif
        var lineOffsetDist = lineOffsetValue * lineNormal.y * extrude;
        // round帽（线端半圆帽）顶点需要让整个帽随所在线段法向刚性平移，
        // 否则帽会沿各自对角线extrude方向被拉扯变形
        let capAxis = vec2f(input.aCapOffset) / EXTRUDE_SCALE;
        lineOffsetDist = mix(lineOffsetDist, -lineOffsetValue * capAxis, lineNormal.x);
        var dist = outset * extrude + lineOffsetDist;
    #else
        let extrude = extrudeXY / EXTRUDE_SCALE;
        var dist = outset * extrude;
    #endif
#endif

    // 按宽度缩放比例缩放挤出偏移量，抵消透视投影导致的线宽近大远小
    dist *= widthScale;

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
    #ifdef HAS_LINES_STORAGE
        let myLineDx = f32(recDx);
    #else
        let myLineDx = f32(input.aLineDxDy.x);
    #endif
#else
    let myLineDx = uniforms.lineDx;
#endif
#ifdef HAS_LINE_DY
    #ifdef HAS_LINES_STORAGE
        let myLineDy = f32(recDy);
    #else
        let myLineDy = f32(input.aLineDxDy.y);
    #endif
#else
    let myLineDy = uniforms.lineDy;
#endif

    //这里可能有z-fighting问题
    let projDistance = output.position.w;
    output.position.x += f32(myLineDx) * 2.0 / shaderUniforms.canvasSize.x * projDistance;
    output.position.y += f32(myLineDy) * 2.0 / shaderUniforms.canvasSize.y * projDistance;

    // 共面 symbol 深度分离：后绘制（symbolIndex 更大）的 mesh 通过 lineDepthBias 把 NDC 深度
    // 确定性地向相机偏移，避免与先绘制的描边完全共面时交替胜负导致 z-fighting 闪烁。
    output.position.z -= uniforms.lineDepthBias * projDistance;

#ifdef HAS_LINE_DEPTH_BIAS
    // vector渲染中同一条线的多symbol被合并在同一mesh内绘制，无法用mesh级uniform区分，
    // 需要按feature（aLineDepthBias）逐顶点偏移NDC深度，使后一个symbol确定性地更靠近相机，
    // 从而避免共面描边/主线在倾斜视角下z-fighting闪烁。
    output.position.z -= input.aLineDepthBias * projDistance;
#endif

#ifndef PICKING_MODE
    output.vWidth = vec2f(outset * widthScale, inset * widthScale);
    if (shaderUniforms.isRenderingTerrain == 1.0) {
        output.vGammaScale = 1.0;
    } else {
        // 与widthScale同理，相机后方顶点的projDistance为负会使vGammaScale为负，
        // 片元抗锯齿blur2随之变负导致alpha计算错误，钳制为0
        output.vGammaScale = max(projDistance, 0.0) / shaderUniforms.cameraToCenterDistance;
    }
    #ifndef ENABLE_TILE_STENCIL
        output.vPosition = position.xy;
        #ifdef USE_LINE_OFFSET
            output.vPosition += lineOffsetDist * widthScale * uniforms.tileRatio / resScale;
        #else
            #ifdef HAS_LINE_OFFSET
                output.vPosition += lineOffsetDist * widthScale * uniforms.tileRatio / resScale;
            #endif
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
            #ifdef HAS_LINES_STORAGE
                output.vColor = vec4f(recColor);
            #else
                output.vColor = vec4f(input.aColor);
            #endif
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
                #ifdef HAS_LINES_STORAGE
                    output.vLinePatternAnimSpeed = f32(recPatternAnimSpeed) / 127.0;
                #else
                    output.vLinePatternAnimSpeed = f32(input.aLinePattern.x) / 127.0;
                #endif
            #endif

            #ifdef HAS_PATTERN_GAP
                #ifdef HAS_LINES_STORAGE
                    output.vLinePatternGap = f32(recPatternGap) / 10.0;
                #else
                    output.vLinePatternGap = f32(input.aLinePattern.y) / 10.0;
                #endif
            #endif
        #endif
    #endif

    #ifdef HAS_STROKE_COLOR
        #ifdef HAS_LINES_STORAGE
            output.vStrokeColor = vec4f(recStrokeColor);
        #else
            output.vStrokeColor = vec4f(input.aStrokeColor);
        #endif
    #endif

    #ifdef HAS_OPACITY
        #ifdef HAS_LINES_STORAGE
            output.vOpacity = f32(recOpacity) / 255.0;
        #else
            output.vOpacity = f32(input.aOpacity) / 255.0;
        #endif
    #endif

    #if HAS_SHADOWING && !HAS_BLOOM
        shadow_computeShadowPars(localVertex, &output);
    #endif
    #if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
        highlight_setVarying(input, &output);
    #endif
#else
    fbo_picking_setData(input, &output, projDistance, true);
#endif

    return output;
}
