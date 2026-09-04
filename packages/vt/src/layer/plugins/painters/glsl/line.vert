#define SHADER_NAME LINE

#define AA_CLIP_LIMIT 2.0
#define AA_LINE_WIDTH 16.0

// the distance over which the line edge fades out.
// Retina devices need a smaller distance to avoid aliasing.
#define DEVICE_PIXEL_RATIO 1.0
#define ANTIALIASING 1.0 / DEVICE_PIXEL_RATIO / 2.0

// floor(127 / 2) == 63.0
// the maximum allowed miter limit is 2.0 at the moment. the extrude normal is
// stored in a byte (-128..127). we scale regular normals up to length 63, but
// there are also "special" normals that have a bigger length (of up to 126 in
// this case).
// #define scale 63.0
// EXTRUDE_SCALE = 1 / 127.0
//0.0078740157
#define EXTRUDE_SCALE 63.0
#define EXTRUDE_MOD 64.0
#define MAX_LINE_DISTANCE 65535.0

#ifdef PICKING_MODE
    #include <gl2_vert>
#endif

#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

#if defined(HAS_PATTERN) || defined(HAS_DASHARRAY)
    attribute vec3 aExtrude;
#else
    attribute vec2 aExtrude;
#endif
#if defined(HAS_PATTERN) || defined(HAS_DASHARRAY) || defined(HAS_GRADIENT) || defined(HAS_TRAIL)
    attribute float aLinesofar;
    varying highp float vLinesofar;
#endif

uniform float cameraToCenterDistance;
#if defined(HAS_STROKE_WIDTH)
    attribute float aLineStrokeWidth;
#else
    uniform float lineStrokeWidth;
#endif

uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
uniform mat4 modelMatrix;
uniform float tileResolution;
uniform float resolution;
//EXTENT / tileSize
uniform float tileRatio;
uniform float isRenderingTerrain;
#if defined(HAS_LINE_DX) || defined(HAS_LINE_DY)
    attribute vec2 aLineDxDy;
#endif
#ifndef HAS_LINE_DX
    uniform float lineDx;
#endif
#ifndef HAS_LINE_DY
    uniform float lineDy;
#endif
#ifdef HAS_LINE_OFFSET
    attribute float aLineOffset;
    // round帽(线端半圆帽)顶点：所在线段单位法向(EXTRUDE_SCALE倍)，供帽顶点刚性平移；非帽顶点为0
    attribute vec2 aCapOffset;
#endif
#ifdef USE_LINE_OFFSET
    uniform float lineOffset;
#endif
uniform vec2 canvasSize;

uniform float layerScale;

// 同一几何的多个 symbol（如线宽10描边 + 线宽8主线）被拆成多个独立 mesh 绘制，它们完全共面，
// 深度只差浮点噪声，倾斜视角下会 z-fighting 闪烁。
// lineDepthBias 为按 symbol 绘制序号递增的 NDC 深度偏置，使后绘制（上层）的线确定性地靠近相机。
uniform float lineDepthBias;

varying vec2 vNormal;
varying vec2 vWidth;
varying float vGammaScale;
#ifndef ENABLE_TILE_STENCIL
    varying vec2 vPosition;
#endif

#ifdef HAS_LINE_WIDTH
    attribute float aLineWidth;
#else
    uniform float lineWidth;
#endif

#ifdef HAS_LINE_DEPTH_BIAS
    // vector渲染中同一条线的多symbol被合并进同一顶点缓冲，这里按feature（symbol顺序）存放NDC深度偏置
    attribute float aLineDepthBias;
#endif

#ifndef PICKING_MODE
    #ifndef HAS_GRADIENT
        #ifdef HAS_COLOR
            attribute vec4 aColor;
            varying vec4 vColor;
        #endif

        #ifdef HAS_PATTERN
            #if defined(HAS_PATTERN_ANIM) || defined(HAS_PATTERN_GAP)
                attribute vec2 aLinePattern;
            #endif
            #ifdef HAS_PATTERN_ANIM
                varying float vLinePatternAnimSpeed;
            #endif

            #ifdef HAS_PATTERN_GAP
                varying float vLinePatternGap;
            #endif

            attribute vec4 aTexInfo;
            varying vec4 vTexInfo;
        #endif

        #ifdef HAS_DASHARRAY
            #ifdef HAS_DASHARRAY_ATTR
                attribute vec4 aDasharray;
                varying vec4 vDasharray;
            #endif

            #ifdef HAS_DASHARRAY_COLOR
                attribute vec4 aDashColor;
                varying vec4 vDashColor;
            #endif
        #endif
    #endif

    #ifdef HAS_STROKE_COLOR
        attribute vec4 aStrokeColor;
        varying vec4 vStrokeColor;
    #endif

    #ifdef HAS_OPACITY
        attribute float aOpacity;
        varying float vOpacity;
    #endif

    #ifdef HAS_GRADIENT
        attribute float aGradIndex;
        varying float vGradIndex;
    #endif

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        #include <vsm_shadow_vert>
    #endif

    #include <highlight_vert>
#else
    #include <fbo_picking_vert>
#endif

// uniform mat4 projMatrix;
// uniform mat4 viewModelMatrix;
// uniform vec2 halton;
// uniform vec2 outSize;

varying vec3 vVertex;

#include <vt_position_vert>

void main() {
    vec3 position = unpackVTPosition();

    // 牺牲了一些extrude的精度 (1/63)，把round和up存在extrude中
    float round = mod(abs(aExtrude.x), 2.0);
    float up = mod(abs(aExtrude.y), 2.0);
    //transfer up from (0 to 1) to (-1 to 1)
    vNormal = vec2(round, up * 2.0 - 1.0);


    vec4 pos4 = vec4(position, 1.0);
    vec4 vertex = projViewModelMatrix * positionMatrix * pos4;
    if (isRenderingTerrain == 1.0) {
        vVertex = (positionMatrix * pos4).xyz;
    } else {
        vVertex = (modelMatrix * positionMatrix * pos4).xyz;
    }

    // 地形皮肤模式下projViewMatrix为单位矩阵，vertex.w与cameraToCenterDistance不在同一坐标系，
    // 因此地形模式继续使用顶点深度与地面投影点深度的比值来补偿线宽
    // 非地形模式下，使用相机深度比例缩放挤出偏移量，使线宽在屏幕上保持恒定像素宽度
    // vertex.w是裁剪空间W值(视图空间深度)，cameraToCenterDistance是相机到视图中心的距离
    // 挤出偏移量乘以vertex.w/cameraToCenterDistance后，透视投影的1/w效应被抵消，线宽不再随深度近大远小
    // 该比例同时隐式补偿了顶点高程：有高程的顶点vertex.w更小，缩放更小，线宽与地面线保持一致
    float widthScale;
    if (isRenderingTerrain == 1.0) {
        vec4 groundVertex = projViewModelMatrix * positionMatrix * vec4(position.xy, 0.0, 1.0);
        widthScale = vertex.w / groundVertex.w;
    } else {
        // 线延伸到相机后方时该顶点vertex.w为负，若直接相除widthScale变负，会使挤出方向翻转
        // 且vWidth变负导致片元中描边/芯线分层错乱；相机后方的几何最终被近平面裁剪，
        // 这里钳制为0，只让线在越过相机的交界处平滑收拢到中心线，不再产生颜色翻转
        widthScale = max(vertex.w, 0.0) / cameraToCenterDistance;
    }

    #ifdef HAS_STROKE_WIDTH
        float strokeWidth = aLineStrokeWidth / 2.0 * layerScale;
    #else
        float strokeWidth = lineStrokeWidth;
    #endif

    #ifdef HAS_LINE_WIDTH
        //除以2.0是为了解决 #190
        float myLineWidth = aLineWidth / 2.0 * layerScale;
    #else
        float myLineWidth = lineWidth * layerScale;
    #endif
    float halfwidth = myLineWidth / 2.0 + strokeWidth;
    // offset = -1.0 * offset;

    float gapwidth = sign(strokeWidth) * myLineWidth / 2.0;
    float inset = gapwidth + sign(gapwidth) * ANTIALIASING;
    float outset = halfwidth + sign(halfwidth) * ANTIALIASING;

    // Scale the extrusion vector down to a normal and then up by the line width
    // of this vertex.
    #if defined(USE_LINE_OFFSET) || defined(HAS_LINE_OFFSET)
        // lineOffset（像素）：为线增加一个沿自身法向（垂直于线方向）的偏移，
        // 偏移后的线整体平移在原来线的一侧，正值向线行进方向的右侧偏移，负值向左。
        // 上下两半顶点分别增减 offset，等价于把整条带宽刚性平移到法向一侧，
        // miter 顶点因 extrude 自带 miterLength 倍率，顶点位移自动放大，保证偏移后 join 依然闭合。
        #ifdef HAS_LINE_OFFSET
            float myLineOffset = aLineOffset;
        #else
            float myLineOffset = lineOffset;
        #endif
        vec2 extrude = aExtrude.xy / EXTRUDE_SCALE;
        vec2 lineOffsetDist = myLineOffset * vNormal.y * extrude;
        #ifdef HAS_LINE_OFFSET
            // round帽（线端半圆帽）顶点需要让整个帽随所在线段法向刚性平移，
            // 否则帽会沿各自对角线extrude方向被拉扯变形
            vec2 capAxis = aCapOffset / EXTRUDE_SCALE;
            lineOffsetDist = mix(lineOffsetDist, -myLineOffset * capAxis, vNormal.x);
        #endif
        vec2 dist = outset * extrude + lineOffsetDist;
    #else
        vec2 extrude = aExtrude.xy / EXTRUDE_SCALE;
        vec2 dist = outset * extrude;
    #endif

    // 按宽度缩放比例缩放挤出偏移量，抵消透视投影导致的线宽近大远小
    dist *= widthScale;

    float resScale = tileResolution / resolution;
    // if (isRenderingTerrain == 1.0) {
    //     resScale = 1.0;
    // } else {
    //     resScale = tileResolution / resolution;
    // }

    vec4 localVertex = vec4(position + vec3(dist, 0.0) * tileRatio / resScale, 1.0);
    gl_Position = projViewModelMatrix * positionMatrix * localVertex;

    // #284 解决倾斜大时的锯齿问题
    // 改为实时增加outset来解决，避免因为只调整xy而产生错误的深度值
    // if (isRenderingTerrain == 0.0) {
    //     float limit = min(AA_CLIP_LIMIT / canvasSize.x, AA_CLIP_LIMIT / canvasSize.y);
    //     float pixelDelta = distance(gl_Position.xy / gl_Position.w, vertex.xy / vertex.w) - limit;
    //     // * lineWidth 为了解决lineWidth为0时的绘制错误， #295
    //     //TODO linePack中 needExtraVertex为true时，一些不应该做抗锯齿计算的点，会出现抗锯齿
    //     if (pixelDelta * myLineWidth < 0.0) {
    //         // 绘制端点和原位置的间距太小，会产生锯齿，通过增加 dist 减少锯齿
    //         float pixelScale = -pixelDelta / limit;
    //         float aaWidth = pixelScale * pixelScale * pixelScale * pixelScale * AA_LINE_WIDTH;
    //         dist += aaWidth * extrude;
    //         outset += aaWidth / 6.0;
    //         // 用新的dist计算新的端点位置
    //         localVertex = vec4(position + vec3(dist, 0.0) * tileRatio / resScale, 1.0);
    //         gl_Position = projViewModelMatrix * positionMatrix * localVertex;
    //     }
    // }

    #ifdef HAS_LINE_DX
        float myLineDx = aLineDxDy[0];
    #else
        float myLineDx = lineDx;
    #endif
    #ifdef HAS_LINE_DY
        float myLineDy = aLineDxDy[1];
    #else
        float myLineDy = lineDy;
    #endif

    //这里可能有z-fighting问题
    float projDistance = gl_Position.w;
    gl_Position.xy += vec2(myLineDx, myLineDy) * 2.0 / canvasSize * projDistance;

    // 共面 symbol 深度分离：后绘制（symbolIndex 更大）的 mesh 通过 lineDepthBias 把 NDC 深度
    // 确定性地向相机偏移，避免与先绘制的描边完全共面时交替胜负导致 z-fighting 闪烁。
    gl_Position.z -= lineDepthBias * projDistance;

    #ifdef HAS_LINE_DEPTH_BIAS
        // vector渲染中同一条线的多symbol被合并在同一mesh内绘制，无法用mesh级uniform区分，
        // 需要按feature（aLineDepthBias）逐顶点偏移NDC深度，使后一个symbol确定性地更靠近相机，
        // 从而避免共面描边/主线在倾斜视角下z-fighting闪烁。
        gl_Position.z -= aLineDepthBias * projDistance;
    #endif

    #ifndef PICKING_MODE
        vWidth = vec2(outset * widthScale, inset * widthScale);
        if (isRenderingTerrain == 1.0) {
            vGammaScale = 1.0;
        } else {
            // 与widthScale同理，相机后方顶点的projDistance为负会使vGammaScale为负，
            // 片元抗锯齿blur2随之变负导致alpha计算错误，钳制为0
            vGammaScale = max(projDistance, 0.0) / cameraToCenterDistance;
        }
        #ifndef ENABLE_TILE_STENCIL
            vPosition = position.xy;
            #if defined(USE_LINE_OFFSET) || defined(HAS_LINE_OFFSET)
                vPosition += lineOffsetDist * widthScale * tileRatio / resScale;
            #endif
        #endif

            #if defined(HAS_PATTERN) || defined(HAS_DASHARRAY) || defined(HAS_GRADIENT)
                #ifdef HAS_GRADIENT
                    vLinesofar = aLinesofar / MAX_LINE_DISTANCE;
                    vGradIndex = aGradIndex;
                #else
                    // /resScale * tileRatio 是为了把像素宽度转换为瓦片内的值域(即tile extent 8192或4096)
                    float linesofar = aLinesofar - halfwidth * aExtrude.z / EXTRUDE_SCALE / resScale * tileRatio;
                    vLinesofar = linesofar / tileRatio * resScale;
                    // vLinesofar = (aLinesofar) / tileRatio * resScale;
                #endif
            #endif

        #ifndef HAS_GRADIENT
            #ifdef HAS_COLOR
                vColor = aColor;
            #endif

            #ifdef HAS_DASHARRAY
                #ifdef HAS_DASHARRAY_ATTR
                    vDasharray = aDasharray;
                #endif

                #ifdef HAS_DASHARRAY_COLOR
                    vDashColor = aDashColor / 255.0;
                #endif
            #endif

            #ifdef HAS_PATTERN
                vTexInfo = vec4(aTexInfo.xy, aTexInfo.zw + 1.0);
                #ifdef HAS_PATTERN_ANIM
                    vLinePatternAnimSpeed = aLinePattern[0] / 127.0;
                #endif

                #ifdef HAS_PATTERN_GAP
                    vLinePatternGap = aLinePattern[1] / 10.0;
                #endif
            #endif
        #endif

        #ifdef HAS_STROKE_COLOR
            vStrokeColor = aStrokeColor;
        #endif

        #ifdef HAS_OPACITY
            vOpacity = aOpacity / 255.0;
        #endif

        #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
            shadow_computeShadowPars(localVertex);
        #endif

        highlight_setVarying();
    #else
        fbo_picking_setData(projDistance, true);
    #endif
}
