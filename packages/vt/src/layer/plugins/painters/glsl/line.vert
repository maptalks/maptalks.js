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
// uniform float lineOffset;
uniform vec2 canvasSize;

uniform float layerScale;

varying vec4 vNormalAndWidth;
#define vNormal vNormalAndWidth.xy
#define vWidth vNormalAndWidth.zw

#if defined(HAS_PATTERN) || defined(HAS_DASHARRAY) || defined(HAS_GRADIENT) || defined(HAS_TRAIL)
    varying highp vec2 vGammaAndLinesofar;
    #define vGammaScale vGammaAndLinesofar.x
    #define vLinesofar vGammaAndLinesofar.y
#else
    varying float vGammaScale;
#endif
#ifndef ENABLE_TILE_STENCIL
    varying vec2 vPosition;
#endif

#ifdef USE_LINE_OFFSET
    attribute vec2 aExtrudeOffset;
#endif

#ifdef HAS_LINE_WIDTH
    attribute float aLineWidth;
#else
    uniform float lineWidth;
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
            #if defined(HAS_PATTERN_ANIM) || defined(HAS_PATTERN_GAP)
                varying vec2 vLinePatternAnimAndGap;
                #ifdef HAS_PATTERN_ANIM
                    #define vLinePatternAnimSpeed vLinePatternAnimAndGap.x
                #endif
                #ifdef HAS_PATTERN_GAP
                    #define vLinePatternGap vLinePatternAnimAndGap.y
                #endif
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
    #ifdef USE_LINE_OFFSET
        vec2 offset = lineOffset * (vNormal.y * (aExtrude.xy - aExtrudeOffset) + aExtrudeOffset);
        vec2 dist = (outset * aExtrude.xy + offset) / EXTRUDE_SCALE;
    #else
        vec2 extrude = aExtrude.xy / EXTRUDE_SCALE;
        vec2 dist = outset * extrude;
    #endif

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

    #ifndef PICKING_MODE
        vWidth = vec2(outset, inset);
        if (isRenderingTerrain == 1.0) {
            vGammaScale = 1.0;
        } else {
            vGammaScale = projDistance / cameraToCenterDistance;
        }
        #ifndef ENABLE_TILE_STENCIL
            vPosition = position.xy;
            #ifdef USE_LINE_OFFSET
                vPosition += tileRatio * offset / EXTRUDE_SCALE;
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
