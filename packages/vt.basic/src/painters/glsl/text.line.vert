#define RAD 0.017453292519943
#define PI  3.141592653589793

attribute vec3 aPosition;
// attribute vec2 aShape;
attribute vec2 aTexCoord;
attribute vec2 aOffset;
// attribute highp float aRotation; //rotation in degree
//flip * 2 + vertical
// attribute float aNormal;
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
uniform mat4 viewMatrix;
uniform float textPerspectiveRatio;
uniform float mapPitch;
uniform float pitchWithMap;

uniform vec2 texSize;
uniform vec2 canvasSize;
uniform float glyphSize;
uniform float tileRatio; //EXTENT / tileSize

varying vec2 vTexCoord;
varying float vGammaScale;
varying float vSize;
varying float vOpacity;

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    float distance = gl_Position.w;
    // float distance = cameraToCenterDistance;

    float cameraScale = distance / cameraToCenterDistance;

    float distanceRatio = (1.0 - cameraToCenterDistance / distance) * textPerspectiveRatio;
    //通过distance动态调整大小
    float perspectiveRatio = clamp(
        0.5 + 0.5 * (1.0 - distanceRatio),
        0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
        4.0);

    //精度修正：js中用int16存放旋转角，会丢失小数点，乘以64能在int16范围内尽量保留小数点后尽量多的位数
    // float rotation = aRotation / 64.0 * RAD + textRotation;
    // float vertical = mod(aNormal, 2.0);
    // rotation += mix(0.0, -PI / 2.0, vertical); //-90 degree

    // float angleSin = sin(rotation);
    // float angleCos = cos(rotation);
    // mat2 shapeMatrix = mat2(angleCos, -angleSin, angleSin, angleCos);

    // vec2 shape = shapeMatrix * aShape;

    vec2 offset = aOffset / 10.0; //精度修正：js中用int16存的offset,会丢失小数点，乘以十后就能保留小数点后1位
    vec2 texCoord = aTexCoord;

    // shape = shape / glyphSize * textSize;

    if (pitchWithMap == 1.0) {
        // offset = shape * vec2(1.0, -1.0) + offset;
        //乘以cameraScale可以抵消相机近大远小的透视效果
        gl_Position = projViewModelMatrix * vec4(aPosition + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
        vGammaScale = cameraScale + mapPitch / 4.0;
    } else {
        vec3 cameraRight = vec3(
            viewMatrix[0].x, viewMatrix[1].x, viewMatrix[2].x
        );
        // vec3 cameraUp = vec3(
        //     viewMatrix[0].y, viewMatrix[1].y, viewMatrix[2].y
        // );
        // offset = (shape + offset * vec2(1.0, -1.0)) * 2.0 / canvasSize;
        // offset = clamp(offset, -7., 7.);

        // offset = offset  * vec2(-1.0, -1.0) * 2.0 / canvasSize * perspectiveRatio * distance;
        // gl_Position.xyz += (cameraRight * offset.x) + (cameraUp * offset.y);
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

