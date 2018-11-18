#define RAD 0.0174532925
#define MAX_PITCH 1.0471975512 //60度

attribute vec3 aPosition;
attribute vec2 aShape0;
attribute vec2 aShape1;
attribute vec2 aTexCoord0;
attribute vec2 aTexCoord1;
attribute float aSize;
attribute vec2 aOffset;
attribute float aRotation;
attribute float aNormal;//flip * 2 + vertical

uniform float zoomScale;
uniform float cameraToCenterDistance;
uniform mat4 projViewModelMatrix;
uniform float textPerspectiveRatio;
uniform float mapPitch;

uniform vec2 texSize;
uniform vec2 canvasSize;
uniform float glyphSize;
uniform float tileRatio; //EXTENT / tileSize

varying vec2 vTexCoord;
varying float vGammaScale;
varying float vSize;

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

    float textRotation = aRotation;
    // textRotation = 0.0;
    float flip = float(int(aNormal) / 2);
    float vertical = mod(aNormal, 2.0);
    textRotation += mix(0.0, 180.0, flip);
    textRotation += mix(0.0, -90.0, vertical);
    textRotation *= RAD;

    float angleSin = sin(textRotation);
    float angleCos = cos(textRotation);
    mat2 shapeMatrix = mat2(angleCos, -1.0 * angleSin, angleSin, angleCos);

    vec2 shape = shapeMatrix * mix(aShape0, aShape1, flip);

    vec2 offset = aOffset;
    vec2 texCoord = mix(aTexCoord0, aTexCoord1, flip);

    shape = shape / glyphSize * aSize;

    offset = (shape + offset) * vec2(1.0, -1.0);

    //乘以cameraScale可以抵消相机近大远小的透视效果
    gl_Position = projViewModelMatrix * vec4(aPosition + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);

    vGammaScale = cameraScale + mapPitch / 2.0 + 0.5;
    vTexCoord = texCoord / texSize;
    vSize = aSize;
}
