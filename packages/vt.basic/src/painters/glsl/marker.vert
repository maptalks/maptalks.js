#define RAD 0.0174532925

#ifdef IS_2D_POSITION
    attribute vec2 aPosition;
#else
    attribute vec3 aPosition;
#endif
attribute vec2 aShape;
attribute vec2 aTexCoord;
//uint8
#ifdef ENABLE_COLLISION
attribute float aOpacity;
#endif

uniform float markerWidth;
uniform float markerHeight;
uniform float markerDx;
uniform float markerDy;
uniform float markerRotation;

uniform float cameraToCenterDistance;
uniform mat4 projViewModelMatrix;
uniform float markerPerspectiveRatio;

uniform vec2 iconSize;
uniform vec2 texSize;
uniform vec2 canvasSize;
uniform float pitchWithMap;
uniform float mapPitch;
uniform float rotateWithMap;
uniform float mapRotation;

uniform float zoomScale;
uniform float tileRatio; //EXTENT / tileSize

varying vec2 vTexCoord;
varying float vOpacity;

void main() {
    #ifdef IS_2D_POSITION
        vec3 position = vec3(aPosition, 0.0);
    #else
        vec3 position = aPosition;
    #endif
    gl_Position = projViewModelMatrix * vec4(position, 1.0);
    float distance = gl_Position.w;

    float distanceRatio = (1.0 - cameraToCenterDistance / distance) * markerPerspectiveRatio;
    //通过distance动态调整大小
    float perspectiveRatio = clamp(
        0.5 + 0.5 * (1.0 - distanceRatio),
        0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
        4.0);

    float rotation = markerRotation - mapRotation * rotateWithMap;
    if (pitchWithMap == 1.0) {
        rotation += mapRotation;
    }
    float angleSin = sin(rotation);
    float angleCos = cos(rotation);

    mat2 shapeMatrix = mat2(angleCos, -1.0 * angleSin, angleSin, angleCos);
    vec2 shape = shapeMatrix * (aShape / 10.0);
    shape = shape / iconSize * vec2(markerWidth, markerHeight);

    if (pitchWithMap == 0.0) {
        vec2 offset = shape * 2.0 / canvasSize;
        gl_Position.xy += offset * perspectiveRatio * distance;
    } else {
        float cameraScale = distance / cameraToCenterDistance;
        vec2 offset = shape * vec2(1.0, -1.0);
        //乘以cameraScale可以抵消相机近大远小的透视效果
        gl_Position = projViewModelMatrix * vec4(position + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
    }

    gl_Position.xy += vec2(markerDx, markerDy) * 2.0 / canvasSize * distance;

    vTexCoord = aTexCoord / texSize;

    #ifdef ENABLE_COLLISION
    vOpacity = aOpacity / 255.0;
    #else
    vOpacity = 1.0;
    #endif
}
