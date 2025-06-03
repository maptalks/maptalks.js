#define SHADER_NAME TEXT_VERT
#define RAD 0.0174532925

#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

attribute vec4 aShape;
#ifdef ENABLE_COLLISION
attribute float aOpacity;
#endif
#ifdef HAS_OPACITY
attribute float aColorOpacity;
#endif

#ifdef HAS_TEXT_SIZE
    attribute float aTextSize;
#else
    uniform float textSize;
#endif

#ifdef HAS_TEXT_DX
    attribute float aTextDx;
#else
    uniform float textDx;
#endif
#ifdef HAS_TEXT_DY
    attribute float aTextDy;
#else
    uniform float textDy;
#endif
#if defined(HAS_PITCH_ALIGN)
    attribute float aPitchAlign;
#else
    uniform float textPitchWithMap;
#endif

#if defined(HAS_TEXT_ROTATION_ALIGN)
    attribute float aRotationAlign;
#else
    uniform float textRotateWithMap;
#endif

uniform float flipY;
#if defined(HAS_TEXT_ROTATION)
    attribute float aRotation;
#else
    uniform float textRotation;
#endif

uniform float cameraToCenterDistance;
uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
uniform float textPerspectiveRatio;

uniform vec2 glyphTexSize;
uniform vec2 canvasSize;
uniform float glyphSize;
uniform float mapPitch;
uniform float mapRotation;

uniform float zoomScale;
uniform float tileRatio; //EXTENT / tileSize

uniform float layerScale;
uniform float isRenderingTerrain;

#ifndef PICKING_MODE
    varying vec2 vTexCoord;
    varying float vGammaScale;
    varying float vTextSize;
    varying float vOpacity;

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
    //picking模式的逻辑
    #include <fbo_picking_vert>
#endif

#include <vt_position_vert>

void main() {
    vec3 position = unpackVTPosition();

    #ifdef HAS_TEXT_SIZE
        float myTextSize = aTextSize * layerScale;
    #else
        float myTextSize = textSize * layerScale;
    #endif
    #ifdef HAS_TEXT_DX
        float myTextDx = aTextDx;
    #else
        float myTextDx = textDx;
    #endif
    #ifdef HAS_TEXT_DY
        float myTextDy = aTextDy;
    #else
        float myTextDy = textDy;
    #endif
    #if defined(HAS_PITCH_ALIGN)
        float isPitchWithMap = aPitchAlign;
    #else
        float isPitchWithMap = textPitchWithMap;
    #endif
    #if defined(HAS_ROTATION_ALIGN)
        float isRotateWithMap = aRotationAlign;
    #else
        float isRotateWithMap = textRotateWithMap;
    #endif

    gl_Position = projViewModelMatrix * positionMatrix * vec4(position, 1.0);
    float projDistance = gl_Position.w;

    //预乘w，得到gl_Position在NDC中的坐标值
    // gl_Position /= gl_Position.w;

    float perspectiveRatio;
    if (isRenderingTerrain == 1.0 && isPitchWithMap == 1.0) {
        perspectiveRatio = 1.0;
    } else {
        float distanceRatio = (1.0 - cameraToCenterDistance / projDistance) * textPerspectiveRatio;
        //通过distance动态调整大小
        perspectiveRatio = clamp(
            0.5 + 0.5 * (1.0 - distanceRatio),
            0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
            4.0);
    }

    #ifdef HAS_TEXT_ROTATION
        float rotation = -aRotation / 9362.0 - mapRotation * isRotateWithMap;
    #else
        float rotation = -textRotation - mapRotation * isRotateWithMap;
    #endif
    if (isPitchWithMap == 1.0) {
        #ifdef REVERSE_MAP_ROTATION_ON_PITCH
            // PointLayer 的  mapRotation 计算方式
            rotation += mapRotation;
        #else
            rotation -= mapRotation;
        #endif
    }
    float angleSin = sin(rotation);
    float angleCos = cos(rotation);

    mat2 shapeMatrix = mat2(angleCos, -1.0 * angleSin, angleSin, angleCos);

    vec2 shape = aShape.xy / 10.0;
    if (isPitchWithMap == 1.0 && flipY == 0.0) {
        shape = shape * vec2(1.0, -1.0);
    }
    vec2 texCoord = aShape.zw;
    shape = shapeMatrix * (shape / glyphSize * myTextSize);


    float cameraScale;
    if (isRenderingTerrain == 1.0) {
        cameraScale = 1.0;
    } else {
        cameraScale = projDistance / cameraToCenterDistance;
    }

    if (isPitchWithMap == 0.0) {
        vec2 offset = shape * 2.0 / canvasSize;
        gl_Position.xy += offset * perspectiveRatio * projDistance;
    } else {
        float offsetScale;
        if (isRenderingTerrain == 1.0) {
            offsetScale = tileRatio / zoomScale;
        } else {
            offsetScale = tileRatio / zoomScale * cameraScale * perspectiveRatio;
        }

        vec2 offset = shape;
        //乘以cameraScale可以抵消相机近大远小的透视效果
        gl_Position = projViewModelMatrix * positionMatrix * vec4(position + vec3(offset, 0.0) * offsetScale, 1.0);
    }
    gl_Position.xy += vec2(myTextDx, -myTextDy) * 2.0 / canvasSize * projDistance;
    // gl_Position.xy += vec2(1.0, 10.0);

    #ifndef PICKING_MODE
        if (isPitchWithMap == 0.0) {
            //当textPerspective:
            //值为1.0时: vGammaScale用cameraScale动态计算
            //值为0.0时: vGammaScale固定为1.2
            vGammaScale = mix(1.0, cameraScale, textPerspectiveRatio);
        } else {
            vGammaScale = cameraScale + mapPitch / 4.0;
        }
        vTexCoord = texCoord / glyphTexSize;
        vGammaScale = clamp(vGammaScale, 0.0, 1.0);

        vTextSize = myTextSize;
        #ifdef ENABLE_COLLISION
            vOpacity = aOpacity / 255.0;
        #else
            vOpacity = 1.0;
        #endif

        #ifdef HAS_OPACITY
            vOpacity *= aColorOpacity / 255.0;
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
        //picking模式的逻辑
        #ifdef ENABLE_COLLISION
            bool visible = aOpacity == 255.0;
        #else
            bool visible = true;
        #endif
        fbo_picking_setData(gl_Position.w, visible);
    #endif
}
