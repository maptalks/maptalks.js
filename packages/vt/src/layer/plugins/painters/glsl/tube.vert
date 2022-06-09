#include <gl2_vert>

#define EXTRUDE_SCALE 63.0
#define EXTRUDE_MOD 64.0
#define MAX_LINE_DISTANCE 65535.0

uniform mat4 projViewModelMatrix;

// lineWidth转成本地坐标，lineWidth单位是厘米
uniform vec2 centiMeterToLocal;

#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

attribute vec3 aTubeNormal;

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
        attribute float aLinesofar;
        varying highp float vLinesofar;
        #if defined(HAS_PATTERN_ANIM) || defined(HAS_PATTERN_GAP)
            attribute vec2 aLinePattern;
        #endif
    #endif

    #ifdef HAS_COLOR
        attribute vec4 aColor;
        varying vec4 vColor;
    #endif

    #ifdef HAS_OPACITY
        attribute float aOpacity;
        varying float vOpacity;
    #endif

    varying vec3 vModelNormal;
    varying vec4 vViewVertex;
    varying vec3 vModelVertex;
#endif

void main() {
    float myLineWidth = lineWidth;
    vec3 tubeNormal = aTubeNormal / EXTRUDE_SCALE;
    vec3 position = unpackVTPosition();
    vec4 localVertex = vec4(position, 1.0);
    localVertex.xy += tubeNormal.xy * myLineWidth * centiMeterToLocal;
    // localVertex.z单位本身就是厘米，所以无需转换
    localVertex.z += tubeNormal.z * myLineWidth;
    gl_Position = projViewModelMatrix * localVertex;
    // gl_Position = projViewModelMatrix * vec4(position, 1.0);

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
        #endif
    #endif
}
