#ifdef IS_2D_POSITION
    attribute vec2 aPosition;
#else
    attribute vec3 aPosition;
#endif
attribute vec2 aTexCoord;
attribute vec2 aOffset;
#ifdef ENABLE_COLLISION
attribute float aOpacity;
#endif

#ifdef HAS_TEXT_SIZE
    attribute float aTextSize;
#else
    uniform float textSize;
#endif
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


#ifdef HAS_TEXT_FILL
    attribute vec4 aTextFill;
    varying vec4 vTextFill;
#endif

#ifdef HAS_TEXT_HALO_FILL
    attribute vec4 aTextHaloFill;
    varying vec4 vTextHaloFill;
#endif

#ifdef HAS_TEXT_HALO_RADIUS
    attribute float aTextHaloRadius;
    varying float vTextHaloRadius;
#endif


void main() {
    #ifdef IS_2D_POSITION
        vec3 position = vec3(aPosition, 0.0);
    #else
        vec3 position = aPosition;
    #endif
    #ifdef HAS_TEXT_SIZE
        float textSize = aTextSize;
    #endif
    gl_Position = projViewModelMatrix * vec4(position, 1.0);
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
        gl_Position = projViewModelMatrix * vec4(position + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
        vGammaScale = cameraScale + mapPitch / 4.0;
    } else {
        gl_Position.xy += offset * 2.0 / canvasSize * perspectiveRatio * distance;
        //当textPerspective:
        //值为1.0时: vGammaScale用cameraScale动态计算
        //值为0.0时: vGammaScale固定为1.2
        vGammaScale = mix(1.0, cameraScale, textPerspectiveRatio);
    }

    gl_Position.xy += vec2(textDx, textDy) * 2.0 / canvasSize * distance;

    vGammaScale = clamp(vGammaScale, 0.0, 1.0);
    vTexCoord = texCoord / texSize;
    vSize = textSize;
    #ifdef ENABLE_COLLISION
        vOpacity = aOpacity / 255.0;
    #else
        vOpacity = 1.0;
    #endif

    #ifdef HAS_TEXT_FILL
        vTextFill = aTextFill / 255.0;
    #endif

    #ifdef HAS_TEXT_HALO_FILL
        vTextHaloFill = aTextHaloFill / 255.0;
    #endif

    #ifdef HAS_TEXT_HALO_RADIUS
        vTextHaloRadius = aTextHaloRadius;
    #endif
}

