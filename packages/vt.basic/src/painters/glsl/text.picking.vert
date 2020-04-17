#define RAD 0.0174532925

attribute vec3 aPosition;

attribute vec2 aShape;
attribute vec2 aTexCoord;
#ifdef ENABLE_COLLISION
attribute float aOpacity;
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
    uniform float pitchWithMap;
#endif

#if defined(HAS_ROTATION_ALIGN)
    attribute float aRotationAlign;
#else
    uniform float rotateWithMap;
#endif
uniform float flipY;
uniform float textRotation;

uniform float cameraToCenterDistance;
uniform mat4 projViewModelMatrix;
uniform float textPerspectiveRatio;

uniform vec2 texSize;
uniform vec2 canvasSize;
uniform float glyphSize;
uniform float mapPitch;
uniform float mapRotation;

uniform float zoomScale;
uniform float tileRatio; //EXTENT / tileSize

#include <fbo_picking_vert>

void main() {
    vec3 position = aPosition;
    #ifdef HAS_TEXT_SIZE
        float textSize = aTextSize;
    #endif
    #ifdef HAS_TEXT_DX
        float textDx = aTextDx;
    #endif
    #ifdef HAS_TEXT_DY
        float textDy = aTextDy;
    #endif
    #if defined(HAS_PITCH_ALIGN)
        float pitchWithMap = aPitchAlign;
    #endif
    #if defined(HAS_ROTATION_ALIGN)
        float rotateWithMap = aRotationAlign;
    #endif
    vec2 shape = aShape / 10.0;
    if (pitchWithMap == 1.0 && flipY == 0.0) {
        shape = shape * vec2(1.0, -1.0);
    }
    vec2 texCoord = aTexCoord;

    gl_Position = projViewModelMatrix * vec4(position, 1.0);
    float distance = gl_Position.w;

    //预乘w，得到gl_Position在NDC中的坐标值
    // gl_Position /= gl_Position.w;

    float distanceRatio = (1.0 - cameraToCenterDistance / distance) * textPerspectiveRatio;
    //通过distance动态调整大小
    float perspectiveRatio = clamp(
        0.5 + 0.5 * (1.0 - distanceRatio),
        0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
        4.0);

    float rotation = textRotation - mapRotation * rotateWithMap;
    if (pitchWithMap == 1.0) {
        rotation += mapRotation;
    }
    float angleSin = sin(rotation);
    float angleCos = cos(rotation);

    mat2 shapeMatrix = mat2(angleCos, -1.0 * angleSin, angleSin, angleCos);
    shape = shapeMatrix * (shape / glyphSize * textSize);

    if (pitchWithMap == 0.0) {
        vec2 offset = shape * 2.0 / canvasSize;
        gl_Position.xy += offset * perspectiveRatio * distance;
    } else {
        float cameraScale = distance / cameraToCenterDistance;
        vec2 offset = shape * vec2(1.0, -1.0);
        //乘以cameraScale可以抵消相机近大远小的透视效果
        gl_Position = projViewModelMatrix * vec4(position + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
    }
    gl_Position.xy += vec2(textDx, -textDy) * 2.0 / canvasSize * distance;

    #ifdef ENABLE_COLLISION
        bool visible = aOpacity == 255.0;
    #else
        bool visible = true;
    #endif
    fbo_picking_setData(gl_Position.w, visible);
}
