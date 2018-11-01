#define RAD 0.0174532925

attribute vec3 aPosition;
attribute vec2 aShape0;
attribute vec2 aTexCoord0;
attribute float aSize;
attribute float aOpacity;
attribute vec2 aOffset0;
attribute float aRotation0;
#if defined(ALONG_LINE)
attribute vec2 aShape1;
attribute vec2 aTexCoord1;
attribute vec2 aOffset1;
attribute vec2 aOffset2;
attribute float aRotation1;
attribute float aRotation2;
uniform float tileResolution;
uniform float resolution;
uniform float isFlip;
uniform float isVertical;
#endif
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

varying vec2 vTexCoord;
varying float vGammaScale;
varying float vSize;

void main() {
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

    #if defined(ALONG_LINE)
        float interpolation, rotation0, rotation1;
        vec2 offset0, offset1;
        float scale = tileResolution / resolution;
        if (scale <= 1.0) {
            interpolation = clamp((scale - 0.5) / 0.5, 0.0, 1.0);
            offset0 = aOffset0;
            offset1 = aOffset1;
            rotation0 = aRotation0;
            rotation1 = aRotation1;
        } else {
            interpolation = clamp(scale - 1.0, 0.0, 1.0);
            offset0 = aOffset1;
            offset1 = aOffset2;
            rotation0 = aRotation1;
            rotation1 = aRotation2;
        }
        float textRotation = mix(rotation0, rotation1, interpolation);
        vec2 offset = mix(offset0, offset1, interpolation);

        vec2 shape = mix(aShape0, aShape1, isFlip);
        vec2 texCoord = mix(aTexCoord0, aTexCoord1, isFlip);

        textRotation += mix(0.0, 180.0, isFlip);
        textRotation += mix(0.0, -90.0, isVertical);
    #else
        float textRotation = aRotation0;
        vec2 offset = aOffset0;
        vec2 shape = aShape0;
        vec2 texCoord = aTexCoord0;
    #endif
    textRotation = textRotation * RAD;

    //计算shape
    //文字的旋转角度
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

    vTexCoord = texCoord / texSize;
    vGammaScale = distance / cameraToCenterDistance;

    vSize = aSize;
}
