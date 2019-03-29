#define RAD 0.0174532925

attribute vec3 aPosition;
attribute vec2 aShape;
attribute vec2 aOffset;
//flip * 2 + vertical
attribute float aNormal;
#ifdef ENABLE_COLLISION
attribute float aOpacity;
#endif

uniform float textSize;
uniform float textDx;
uniform float textDy;
uniform float textRotation;

uniform float zoomScale;
uniform float cameraToCenterDistance;
uniform mat4 projViewModelMatrix;
uniform float textPerspectiveRatio;
uniform float mapPitch;
uniform float pitchWithMap;

uniform vec2 texSize;
uniform vec2 canvasSize;
uniform float glyphSize;
uniform float tileRatio; //EXTENT / tileSize

#include <fbo_picking_vert>

void main() {
    vec4 pos = projViewModelMatrix * vec4(aPosition, 1.0);
    float distance = pos.w;

    float cameraScale = distance / cameraToCenterDistance;

    float distanceRatio = (1.0 - cameraToCenterDistance / distance) * textPerspectiveRatio;
    //通过distance动态调整大小
    float perspectiveRatio = clamp(
        0.5 + 0.5 * (1.0 - distanceRatio),
        0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
        4.0);

    //精度修正：js中用int16存放旋转角，会丢失小数点，乘以64能在int16范围内尽量保留小数点后尽量多的位数
    float rotation = aRotation / 64.0 * RAD + textRotation;
    float flip = float(int(aNormal) / 2);
    float vertical = mod(aNormal, 2.0);
    rotation += mix(0.0, -PI / 2.0, vertical); //-90 degree

    float angleSin = sin(rotation);
    float angleCos = cos(rotation);
    mat2 shapeMatrix = mat2(angleCos, -angleSin, angleSin, angleCos);

    vec2 shape = shapeMatrix * aShape;

    vec2 offset = aOffset / 10.0; //精度修正：js中用int16存的offset,会丢失小数点，乘以十后就能保留小数点后1位


    shape = shape / glyphSize * textSize;

    if (pitchWithMap == 1.0) {
        offset = shape * vec2(1.0, -1.0) + offset;
        //乘以cameraScale可以抵消相机近大远小的透视效果
        gl_Position = projViewModelMatrix * vec4(aPosition + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
    } else {
        offset = (shape + offset * vec2(1.0, -1.0)) * 2.0 / canvasSize;
        pos.xy += offset * perspectiveRatio * pos.w;
        gl_Position = pos;
    }

    gl_Position.xy += vec2(textDx, textDy) * 2.0 / canvasSize * distance;

    #ifdef ENABLE_COLLISION
        bool visible = aOpacity == 255.0;
    #else
        bool visible = true;
    #endif
    fbo_picking_setData(gl_Position.w, visible);
}
