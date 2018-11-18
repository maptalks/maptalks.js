#define RAD 0.0174532925

attribute vec3 aPosition;
attribute vec2 aShape0;
attribute vec2 aTexCoord0;
attribute float aSize;
attribute vec2 aOffset;
attribute float aRotation;

uniform float cameraToCenterDistance;
uniform mat4 projViewModelMatrix;
uniform float textPerspectiveRatio;
uniform mat3 planeMatrix;

uniform vec2 texSize;
uniform vec2 canvasSize;
uniform float glyphSize;
uniform float pitchWithMap;
uniform float mapPitch;
uniform float rotateWithMap;
uniform float mapRotation;

#include <fbo_picking_vert>

void main() {

    float textRotation = aRotation;
    vec2 offset = aOffset;
    vec2 shape = aShape0;
    vec2 texCoord = aTexCoord0;

    textRotation = textRotation * RAD;

    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    float distance = gl_Position.w;
    //预乘w，得到gl_Position在NDC中的坐标值
    // gl_Position /= gl_Position.w;

    float distanceRatio = (1.0 - cameraToCenterDistance / distance) * textPerspectiveRatio;
    //通过distance动态调整大小
    float perspectiveRatio = clamp(
        0.5 + 0.5 * (1.0 - distanceRatio),
        0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
        4.0);
    float pitch = mapPitch * pitchWithMap;
    float rotation = textRotation - mapRotation * rotateWithMap;
    float angleSin = sin(rotation);
    float angleCos = cos(rotation);
    // section 3 随视角倾斜
    // 手动构造3x3旋转矩阵 http://planning.cs.uiuc.edu/node102.html
    float pitchSin = sin(pitch);
    float pitchCos = cos(pitch);
    mat3 shapeMatrix = mat3(angleCos, -1.0 * angleSin * pitchCos, angleSin * pitchSin,
        angleSin, angleCos * pitchCos, -1.0 * angleCos * pitchSin,
        0.0, pitchSin, pitchCos);
    shape = (shapeMatrix * vec3(shape, 0.0)).xy;
    shape = shape / glyphSize * aSize * 2.0 / canvasSize; //乘以2.0

    //计算 offset
    offset = (planeMatrix * vec3(offset, 0.0)).xy;
    offset = offset * 2.0 / canvasSize;

    gl_Position.xy += (shape + offset) * perspectiveRatio * gl_Position.w;

    fbo_picking_setData(gl_Position.w);
}
