attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec2 aOffset;
#ifdef ENABLE_COLLISION
attribute float aOpacity;
#endif

uniform float textSize;
uniform float textDx;
uniform float textDy;

uniform float zoomScale;
uniform float cameraToCenterDistance;
uniform mat4 projViewModelMatrix;
uniform float textPerspectiveRatio;
uniform float mapPitch;
uniform float pitchWithMap;

uniform vec2 texSize;
uniform vec2 canvasSize;
uniform float tileRatio; //EXTENT / tileSize

varying vec2 vTexCoord;
varying float vGammaScale;
varying float vSize;
varying float vOpacity;

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    float distance = gl_Position.w;

    float cameraScale = distance / cameraToCenterDistance;

    float distanceRatio = (1.0 - cameraToCenterDistance / distance) * textPerspectiveRatio;
    //通过distance动态调整大小
    float perspectiveRatio = clamp(
        0.5 + 0.5 * (1.0 - distanceRatio),
        0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
        4.0);

    vec2 offset = aOffset / 10.0; //精度修正：js中用int16存的offset,会丢失小数点，乘以十后就能保留小数点后1位
    vec2 texCoord = aTexCoord;

    if (pitchWithMap == 1.0) {
        //乘以cameraScale可以抵消相机近大远小的透视效果
        gl_Position = projViewModelMatrix * vec4(aPosition + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
        vGammaScale = cameraScale + mapPitch / 4.0;
    } else {
        gl_Position.xy += offset * 2.0 / canvasSize * perspectiveRatio * distance;
        //当textPerspective:
        //值为1.0时: vGammaScale用cameraScale动态计算
        //值为0.0时: vGammaScale固定为1.2
        vGammaScale = mix(1.0, cameraScale, textPerspectiveRatio);
    }

    gl_Position.xy += vec2(textDx, textDy) * 2.0 / canvasSize * distance;

    vGammaScale = clamp(vGammaScale, 0.0, 1.3);
    vTexCoord = texCoord / texSize;
    vSize = textSize;
    #ifdef ENABLE_COLLISION
    vOpacity = aOpacity / 255.0;
    #else
    vOpacity = 1.0;
    #endif
}

