#define RAD 0.0174532925

attribute vec3 aPosition;
attribute vec2 aShape0;
attribute vec2 aTexCoord0;
attribute float aSize;
attribute vec2 aDxDy;
attribute float aRotation;
//uint8
#ifdef ENABLE_COLLISION
attribute float aOpacity;
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

uniform float zoomScale;
uniform float tileRatio; //EXTENT / tileSize

varying vec2 vTexCoord;
varying float vGammaScale;
varying float vSize;
varying float vOpacity;

void main() {

    float textRotation = aRotation;
    vec2 shape = aShape0;
    vec2 texCoord = aTexCoord0;

    textRotation = textRotation * RAD;

    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    float distance = gl_Position.w;

    float cameraScale = distance / cameraToCenterDistance;
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
    shape = shapeMatrix * shape / glyphSize * aSize;

    if (pitchWithMap == 0.0) {
        vec2 offset = shape * 2.0 / canvasSize;
        gl_Position.xy += offset * perspectiveRatio * distance;
        vGammaScale = distance / cameraToCenterDistance + 0.5;
    } else {
        vec2 offset = shape * vec2(1.0, -1.0);
        //乘以cameraScale可以抵消相机近大远小的透视效果
        gl_Position = projViewModelMatrix * vec4(aPosition + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
        vGammaScale = cameraScale + mapPitch / 2.0 + 0.5;
    }
    gl_Position.xy += aDxDy * 2.0 / canvasSize;

    vTexCoord = texCoord / texSize;


    vSize = aSize;
    #ifdef ENABLE_COLLISION
    vOpacity = aOpacity / 255.0;
    #else
    vOpacity = 1.0;
    #endif
}
