#include <gl2_vert>
#define SHADER_NAME MARKER
#define RAD 0.0174532925

#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

attribute vec2 aShape;
attribute vec2 aTexCoord;
//uint8
#ifdef ENABLE_COLLISION
    attribute float aOpacity;
#endif

#ifdef HAS_OPACITY
    attribute float aColorOpacity;
#endif

#ifdef HAS_MARKER_WIDTH
    attribute float aMarkerWidth;
#else
    uniform float markerWidth;
#endif
#ifdef HAS_MARKER_HEIGHT
    attribute float aMarkerHeight;
#else
    uniform float markerHeight;
#endif
#ifdef HAS_MARKER_DX
    attribute float aMarkerDx;
#else
    uniform float markerDx;
#endif
#ifdef HAS_MARKER_DY
    attribute float aMarkerDy;
#else
    uniform float markerDy;
#endif
#if defined(HAS_PITCH_ALIGN)
    attribute float aPitchAlign;
#else
    uniform float pitchWithMap;
#endif

#if defined(HAS_ROTATION_ALIGN)
    attribute float aRotationAlign;
#else
    uniform float rotateWithMap;
#endif

uniform float flipY;
#ifdef HAS_ROTATION
    attribute float aRotation;
#else
    uniform float markerRotation;
#endif


#ifdef HAS_PAD_OFFSET
attribute float aPadOffsetX;
attribute float aPadOffsetY;
#endif

uniform float cameraToCenterDistance;
uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
uniform float markerPerspectiveRatio;

uniform vec2 iconSize;
uniform vec2 texSize;
uniform vec2 canvasSize;
uniform float mapPitch;
uniform float mapRotation;

uniform float zoomScale;
 //EXTENT / tileSize
uniform float tileRatio;

uniform float layerScale;

uniform float isRenderingTerrain;

#include <vt_position_vert>

#ifndef PICKING_MODE
    varying vec2 vTexCoord;
    varying float vOpacity;

    #include <highlight_vert>
#else
    #include <fbo_picking_vert>
#endif

void main() {
    vec3 position = unpackVTPosition();
    #ifdef HAS_MARKER_WIDTH
        float myMarkerWidth = aMarkerWidth;
    #else
        float myMarkerWidth = markerWidth;
    #endif
    #ifdef HAS_MARKER_HEIGHT
        float myMarkerHeight = aMarkerHeight;
    #else
        float myMarkerHeight = markerHeight;
    #endif
    #ifdef HAS_MARKER_DX
        float myMarkerDx = aMarkerDx;
    #else
        float myMarkerDx = markerDx;
    #endif
    #ifdef HAS_MARKER_DY
        float myMarkerDy = aMarkerDy;
    #else
        float myMarkerDy = markerDy;
    #endif
    #if defined(HAS_PITCH_ALIGN)
        float isPitchWithMap = aPitchAlign;
    #else
        float isPitchWithMap = pitchWithMap;
    #endif
    #if defined(HAS_ROTATION_ALIGN)
        float isRotateWithMap = aRotationAlign;
    #else
        float isRotateWithMap = rotateWithMap;
    #endif
    gl_Position = projViewModelMatrix * positionMatrix * vec4(position, 1.0);
    float projDistance = gl_Position.w;
    

    float perspectiveRatio;
    if (isRenderingTerrain == 1.0 && isPitchWithMap == 1.0) {
        perspectiveRatio = 1.0;
    } else {
        float distanceRatio = (1.0 - cameraToCenterDistance / projDistance) * markerPerspectiveRatio;
        //通过distance动态调整大小
        perspectiveRatio = clamp(
            0.5 + 0.5 * (1.0 - distanceRatio),
            0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
            4.0);
    }
    #ifdef HAS_ROTATION
        float rotation = -aRotation / 9362.0 - mapRotation * isRotateWithMap;
    #else
        float rotation = -markerRotation - mapRotation * isRotateWithMap;
    #endif

    if (isPitchWithMap == 1.0) {
        rotation += mapRotation;
    }
    float angleSin = sin(rotation);
    float angleCos = cos(rotation);

    mat2 shapeMatrix = mat2(angleCos, -1.0 * angleSin, angleSin, angleCos);
    vec2 shape = (aShape / 10.0);
    if (isPitchWithMap == 1.0 && flipY == 0.0) {
        shape *= vec2(1.0, -1.0);
    }
    #ifdef HAS_PAD_OFFSET
        // aPadOffsetX - 1.0 是为了解决1个像素偏移的问题, fuzhenn/maptalks-designer#638
        shape = (shape / iconSize * vec2(myMarkerWidth, myMarkerHeight) + vec2(aPadOffsetX - 1.0, aPadOffsetY)) * layerScale;
    #else
        shape = shape / iconSize * vec2(myMarkerWidth, myMarkerHeight) * layerScale;
    #endif
    shape = shapeMatrix * shape;

    if (isPitchWithMap == 0.0) {
        vec2 offset = shape * 2.0 / canvasSize;
        gl_Position.xy += offset * perspectiveRatio * projDistance;
    } else {
        float cameraScale;
        if (isRenderingTerrain == 1.0) {
            cameraScale = 1.0;
        } else {
            cameraScale = projDistance / cameraToCenterDistance;
        }
        vec2 offset = shape;
        //乘以cameraScale可以抵消相机近大远小的透视效果
        gl_Position = projViewModelMatrix * positionMatrix * vec4(position + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
    }

    gl_Position.xy += vec2(myMarkerDx, -myMarkerDy) * 2.0 / canvasSize * projDistance;

    #ifndef PICKING_MODE
        vTexCoord = aTexCoord / texSize;

        #ifdef ENABLE_COLLISION
            vOpacity = aOpacity / 255.0;
        #else
            vOpacity = 1.0;
        #endif

        #ifdef HAS_OPACITY
            vOpacity *= aColorOpacity / 255.0;
        #endif

        highlight_setVarying();
    #else
        #ifdef ENABLE_COLLISION
            bool visible = aOpacity == 255.0;
        #else
            bool visible = true;
        #endif

        fbo_picking_setData(gl_Position.w, visible);
    #endif
}
