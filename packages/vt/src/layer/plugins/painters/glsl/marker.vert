#include <gl2_vert>
#define SHADER_NAME MARKER
#define RAD 0.0174532925

#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

attribute vec4 aShape;
//uint8
#ifdef ENABLE_COLLISION
    attribute float aOpacity;
#endif

#ifdef HAS_OPACITY
    attribute vec2 aColorOpacity;
#endif

#ifdef HAS_TEXT_SIZE
    attribute float aTextSize;
#else
    uniform float textSize;
#endif

#if defined(HAS_TEXT_DX) || defined(HAS_TEXT_DY) || defined(HAS_MARKER_DX) || defined(HAS_MARKER_DY)
    attribute vec4 aDxDy;
#endif
#ifndef HAS_MARKER_DX
    uniform float markerDx;
#endif
#ifndef HAS_MARKER_DY
    uniform float markerDy;
#endif
#ifndef HAS_TEXT_DX
    uniform float textDx;
#endif
#ifndef HAS_TEXT_DY
    uniform float textDy;
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

#if defined(HAS_MARKER_PITCH_ALIGN) || defined(HAS_TEXT_PITCH_ALIGN)
    attribute vec2 aPitchAlign;
#endif
#ifndef HAS_MARKER_PITCH_ALIGN
    uniform float markerPitchWithMap;
#endif
#ifndef HAS_TEXT_PITCH_ALIGN
    uniform float textPitchWithMap;
#endif

#if defined(HAS_MARKER_ROTATION_ALIGN) || defined(HAS_TEXT_ROTATION_ALIGN)
    attribute vec2 aRotationAlign;
#endif
#ifndef HAS_MARKER_ROTATION_ALIGN
    uniform float markerRotateWithMap;
#endif
#ifndef HAS_TEXT_ROTATION_ALIGN
    uniform float textRotateWithMap;
#endif

uniform float flipY;
#if defined(HAS_MARKER_ROTATION) || defined(HAS_TEXT_ROTATION)
    attribute vec2 aRotation;
#endif
#ifndef HAS_MARKER_ROTATION
    uniform float markerRotation;
#endif
#ifndef HAS_TEXT_ROTATION
    uniform float textRotation;
#endif


#ifdef HAS_PAD_OFFSET
attribute vec2 aPadOffset;
#endif

uniform float cameraToCenterDistance;
uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
uniform float textPerspectiveRatio;
uniform float markerPerspectiveRatio;

uniform float glyphSize;
uniform vec2 iconSize;
uniform vec2 canvasSize;
uniform vec2 iconTexSize;
uniform vec2 glyphTexSize;
uniform float mapPitch;
uniform float mapRotation;

uniform float zoomScale;
 //EXTENT / tileSize
uniform float tileRatio;

uniform float layerScale;
uniform float isRenderingTerrain;

#include <vt_position_vert>

varying float vIsText;
#ifndef PICKING_MODE
    varying vec2 vTexCoord;
    varying float vOpacity;
    varying float vGammaScale;
    varying float vTextSize;
    varying float vHalo;

    #ifdef HAS_TEXT_FILL
        attribute vec4 aTextFill;
        varying vec4 vTextFill;
    #endif

    #ifdef HAS_TEXT_HALO_FILL
        attribute vec4 aTextHaloFill;
        varying vec4 vTextHaloFill;
    #endif

    #if defined(HAS_TEXT_HALO_RADIUS) || defined(HAS_TEXT_HALO_OPACITY)
        attribute vec2 aTextHalo;
        varying vec2 vTextHalo;
    #endif

    #include <highlight_vert>
#else
    #include <fbo_picking_vert>
#endif

void main() {
    vec3 position = unpackVTPosition();
    #ifdef HAS_TEXT_SIZE
        float myTextSize = aTextSize * layerScale;
    #else
        float myTextSize = textSize * layerScale;
    #endif
    #ifdef HAS_TEXT_DX
        float myTextDx = aDxDy.z;
    #else
        float myTextDx = textDx;
    #endif
    #ifdef HAS_TEXT_DY
        float myTextDy = aDxDy.w;
    #else
        float myTextDy = textDy;
    #endif
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
        float myMarkerDx = aDxDy.x;
    #else
        float myMarkerDx = markerDx;
    #endif
    #ifdef HAS_MARKER_DY
        float myMarkerDy = aDxDy.y;
    #else
        float myMarkerDy = markerDy;
    #endif
    float isText = mod(aShape.z, 2.0);
    float isPitchWithMap;
    if (isText > 0.5) {
        #ifdef HAS_TEXT_PITCH_ALIGN
            isPitchWithMap = aPitchAlign.y;
        #else
            isPitchWithMap = textPitchWithMap;
        #endif
    } else {
        #ifdef HAS_MARKER_PITCH_ALIGN
            isPitchWithMap = aPitchAlign.x;
        #else
            isPitchWithMap = markerPitchWithMap;
        #endif
    }

    float isRotateWithMap;
    if (isText > 0.5) {
        #ifdef HAS_TEXT_ROTATION_ALIGN
            isRotateWithMap = aRotationAlign.y;
        #else
            isRotateWithMap = textRotateWithMap;
        #endif
    } else {
        #ifdef HAS_MARKER_ROTATION_ALIGN
            isRotateWithMap = aRotationAlign.x;
        #else
            isRotateWithMap = markerRotateWithMap;
        #endif
    }

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
    float rotation;
    if (isText > 0.5) {
        #ifdef HAS_TEXT_ROTATION
            rotation = -aRotation.y / 9362.0 - mapRotation * isRotateWithMap;
        #else
            rotation = -textRotation - mapRotation * isRotateWithMap;
        #endif
    } else {
        // icon
        #ifdef HAS_MARKER_ROTATION
            rotation = -aRotation.x / 9362.0 - mapRotation * isRotateWithMap;
        #else
            rotation = -markerRotation - mapRotation * isRotateWithMap;
        #endif
    }

    if (isPitchWithMap == 1.0) {
        #ifdef REVERSE_MAP_ROTATION_ON_PITCH
            // PointLayer 下 text 和 icon 的 mapRotation 计算一致
            rotation += mapRotation;
        #else
            if (isText > 0.5) {
                rotation -= mapRotation;
            } else {
                rotation += mapRotation;
            }
        #endif
    }
    float angleSin = sin(rotation);
    float angleCos = cos(rotation);

    mat2 shapeMatrix = mat2(angleCos, -1.0 * angleSin, angleSin, angleCos);

    vec2 shape = (aShape.xy / 10.0);
    if (isPitchWithMap == 1.0 && flipY == 0.0) {
        shape *= vec2(1.0, -1.0);
    }
    vIsText = isText;
    if (isText > 0.5) {
        shape = shape / glyphSize * myTextSize;
    } else {

        #ifdef HAS_PAD_OFFSET
            // aPadOffset.x - 1.0 是为了解决1个像素偏移的问题, fuzhenn/maptalks-designer#638
            float padOffsetX = aPadOffset.x - 1.0;
            float padOffsetY = aPadOffset.y;
        #else
            float padOffsetX = 0.0;
            float padOffsetY = 0.0;
        #endif
        shape = (shape / iconSize * vec2(myMarkerWidth, myMarkerHeight) + vec2(padOffsetX, padOffsetY)) * layerScale;
    }


    shape = shapeMatrix * shape;

    float cameraScale;
    if (isRenderingTerrain == 1.0) {
        cameraScale = 1.0;
    } else {
        cameraScale = projDistance / cameraToCenterDistance;
    }

    if (isPitchWithMap == 0.0) {
        vec2 offset = shape * 2.0 / canvasSize;
        gl_Position.xy += offset * perspectiveRatio * projDistance;
    } else if (isText > 0.5) {
        float offsetScale;
        if (isRenderingTerrain == 1.0) {
            offsetScale = tileRatio / zoomScale;
        } else {
            offsetScale = tileRatio / zoomScale * cameraScale * perspectiveRatio;
        }
        vec2 offset = shape;
        //乘以cameraScale可以抵消相机近大远小的透视效果
        gl_Position = projViewModelMatrix * positionMatrix * vec4(position + vec3(offset, 0.0) * offsetScale, 1.0);
    } else {
        vec2 offset = shape;
        //乘以cameraScale可以抵消相机近大远小的透视效果
        gl_Position = projViewModelMatrix * positionMatrix * vec4(position + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
    }

    if (isText > 0.5) {
        gl_Position.xy += vec2(myTextDx, -myTextDy) * 2.0 / canvasSize * projDistance;
    } else {
        gl_Position.xy += vec2(myMarkerDx, -myMarkerDy) * 2.0 / canvasSize * projDistance;;
    }

    #ifndef PICKING_MODE
        if (isPitchWithMap == 0.0) {
            //当textPerspective:
            //值为1.0时: vGammaScale用cameraScale动态计算
            //值为0.0时: vGammaScale固定为1.2
            vGammaScale = mix(1.0, cameraScale, textPerspectiveRatio);
        } else {
            vGammaScale = cameraScale + mapPitch / 4.0;
        }
        vGammaScale = clamp(vGammaScale, 0.0, 1.0);

        vec2 texCoord = floor(aShape.zw / 2.0);
        if (isText > 0.5) {
            vTexCoord = texCoord / glyphTexSize;
        } else {
            vTexCoord = texCoord / iconTexSize;
        }

        vHalo = mod(aShape.w, 2.0);
        vTextSize = myTextSize;
        #ifdef ENABLE_COLLISION
            vOpacity = aOpacity / 255.0;
        #else
            vOpacity = 1.0;
        #endif

        #ifdef HAS_OPACITY
            if (isText > 0.5) {
                vOpacity *= aColorOpacity.y / 255.0;
            } else {
                vOpacity *= aColorOpacity.x / 255.0;
            }
        #endif

        #ifdef HAS_TEXT_FILL
            vTextFill = aTextFill / 255.0;
        #endif

        #ifdef HAS_TEXT_HALO_FILL
            vTextHaloFill = aTextHaloFill / 255.0;
        #endif

        #if defined(HAS_TEXT_HALO_RADIUS) || defined(HAS_TEXT_HALO_OPACITY)
            vTextHalo = aTextHalo;
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
