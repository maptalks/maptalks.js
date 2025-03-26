#include <gl2_vert>

#define EXTRUDE_SCALE 63.0
#define EXTRUDE_MOD 64.0
#define MAX_LINE_DISTANCE 65535.0

uniform mat4 projViewModelMatrix;
uniform mat4 positionMatrix;

// lineWidth转成本地坐标，lineWidth单位是厘米
uniform vec2 centiMeterToLocal;

#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

attribute vec4 aTubeNormal;

// lineWidth单位是厘米
#ifdef HAS_LINE_WIDTH
    attribute float aLineWidth;
#else
    uniform float lineWidth;
#endif

#include <vt_position_vert>

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#else
    uniform mat4 modelViewMatrix;
    uniform mat3 modelNormalMatrix;
    uniform mat4 modelMatrix;

    #if defined(HAS_PATTERN)
        uniform float resolution;
        uniform float tileResolution;
        // extent / tileSize
        uniform float tileRatio;

        attribute float aLinesofar;
        varying highp float vLinesofar;

        attribute vec4 aTexInfo;
        varying vec4 vTexInfo;

        varying float vNormalY;
        varying float vPatternHeight;

        attribute float aNormalDistance;

        #if defined(HAS_PATTERN_ANIM)
            attribute float aLinePatternAnimSpeed;
            varying float vLinePatternAnimSpeed;
        #endif
        #if defined(HAS_PATTERN_GAP)
            attribute float aLinePatternGap;
            varying float vLinePatternGap;
        #endif
    #endif

    #ifdef HAS_COLOR
        attribute vec4 aColor;
        varying vec4 vColor;
    #endif

    #ifdef HAS_OPACITY
        attribute float aOpacity;
    #endif
    varying float vOpacity;

    varying vec3 vModelNormal;
    varying vec4 vViewVertex;
    varying vec3 vModelVertex;
#endif

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif

#include <highlight_vert>

void main() {
    #ifdef HAS_LINE_WIDTH
        float myLineWidth = aLineWidth;
    #else
        float myLineWidth = lineWidth;
    #endif

    float halfwidth = myLineWidth / 2.0;
    vec3 tubeNormal = aTubeNormal.xyz / EXTRUDE_SCALE;
    vec3 position = unpackVTPosition();
    vec4 localVertex = vec4(position, 1.0);
    localVertex.xy += tubeNormal.xy * halfwidth * centiMeterToLocal;
    // localVertex.z单位本身就是厘米，所以无需转换
    localVertex.z += tubeNormal.z * halfwidth;
    gl_Position = projViewModelMatrix * localVertex;
    // gl_Position = projViewModelMatrix * positionMatrix * vec4(position, 1.0);

    #ifdef PICKING_MODE
        fbo_picking_setData(gl_Position.w, true);
    #else

        vViewVertex = modelViewMatrix * localVertex;

        vec3 localNormal = normalize(tubeNormal);
        vModelNormal = modelNormalMatrix * localNormal;
        vModelVertex = (modelMatrix * localVertex).xyz;
        #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
            shadow_computeShadowPars(localVertex);
        #endif

        #ifdef HAS_COLOR
            vColor = aColor / 255.0;
            // 检查up的方向是否正确
            // vColor = vec4(aTubeNormal.w / EXTRUDE_SCALE, 0.0, 0.0, 1.0);
        #endif
        #ifdef HAS_OPACITY
            vOpacity = aOpacity / 255.0;
        #else
            vOpacity = 1.0;
        #endif

        #ifdef HAS_PATTERN

            // /scale * tileRatio 是为了把像素宽度转换为瓦片内的值域(即tile extent 8192或4096)
            float scale = tileResolution / resolution;
            float linesofar = aLinesofar - halfwidth * centiMeterToLocal.y * aNormalDistance / EXTRUDE_SCALE;
            // float linesofar = aLinesofar;
            vLinesofar = linesofar / tileRatio * scale;
            vTexInfo = vec4(aTexInfo.xy, aTexInfo.zw + 1.0);
            vPatternHeight = myLineWidth * centiMeterToLocal.x / tileRatio * scale;
            vNormalY = aTubeNormal.w / EXTRUDE_SCALE;
            #if defined(HAS_PATTERN_ANIM)
                vLinePatternAnimSpeed = aLinePatternAnimSpeed / 127.0;
            #endif
            #if defined(HAS_PATTERN_GAP)
                vLinePatternGap = aLinePatternGap / 10.0;
            #endif
        #endif

        highlight_setVarying();
    #endif
}
