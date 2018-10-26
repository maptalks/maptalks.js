attribute vec3 aPosition;
attribute vec2 aShape;
attribute vec2 aTexCoord;
attribute float aSize;
attribute float aOpacity;
attribute vec2 aOffset0;
attribute vec2 aOffset1;
attribute vec2 aOffset2;
attribute vec3 aRotation;

uniform float tileResolution;
uniform float resolution;
uniform float cameraToCenterDistance;
// uniform float uCosPitch;
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

    float scale = tileResolution / resolution;
    float interpolation, rotation0, rotation1;
    vec2 offset0, offset1;

    if (scale <= 1.0) {
        interpolation = clamp((scale - 0.5) / 0.5, 0.0, 1.0);
        offset0 = aOffset0;
        offset1 = aOffset1;
        rotation0 = aRotation.x;
        rotation1 = aRotation.y;
    } else {
        interpolation = clamp(scale - 1.0, 0.0, 1.0);
        offset0 = aOffset1;
        offset1 = aOffset2;
        rotation0 = aRotation.y;
        rotation1 = aRotation.z;
    }

    //计算shape
    //文字的旋转角度
    float textRotation = mix(rotation0, rotation1, interpolation);
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
    vec2 shape = aShape;
    shape = (shapeMatrix * vec3(shape, 0.0)).xy;
    shape = shape / glyphSize * aSize * 2.0 / canvasSize; //乘以2.0

    //计算 offset
    vec2 offset = mix(offset0, offset1, interpolation);
    offset = (planeMatrix * vec3(offset, 0.0)).xy;
    offset = offset * 2.0 / canvasSize;

    gl_Position.xy += (shape + offset) * perspectiveRatio * gl_Position.w;

    vTexCoord = aTexCoord / texSize;
    vGammaScale = distance / cameraToCenterDistance;

    vSize = aSize;
}
