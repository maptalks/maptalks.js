#define SDF_PX 8.0
#define DEVICE_PIXEL_RATIO 1.0
#define EDGE_GAMMA 0.105 / DEVICE_PIXEL_RATIO

precision mediump float;

uniform sampler2D texture;
uniform vec4 textFill;
uniform float textOpacity;
uniform highp float gammaScale;
uniform int isHalo;
uniform highp float textHaloRadius;
uniform vec4 textHaloFill;
uniform highp float textHaloBlur;
uniform float textHaloOpacity;

uniform float fadeOpacity;

varying vec2 vTexCoord;
varying float vSize;
varying float vGammaScale;

void main() {
    float fontScale = vSize / 24.0;

    lowp vec4 color = textFill;
    highp float gamma = EDGE_GAMMA / (fontScale * gammaScale);
    lowp float buff = 192.0 / 256.0;//(256.0 - 64.0) / 256.0;
    if (isHalo == 1) {
        color = textHaloFill;
        gamma = (textHaloBlur * 1.19 / SDF_PX + EDGE_GAMMA) / (fontScale * gammaScale);
        buff = (6.0 - textHaloRadius / fontScale) / SDF_PX;
    }

    float dist = texture2D(texture, vTexCoord).a;
    highp float gammaScaled = gamma * vGammaScale;

    float alpha = clamp(smoothstep(buff - gammaScaled, buff + gammaScaled, dist) * 1.2, 0.0, 1.0);
    // float alpha = smoothstep(buff - gammaScaled, buff + gammaScaled, dist);
    // gl_FragColor = vec4(textFill.rgb, alpha * textFill.a);
    gl_FragColor = color * (alpha * textOpacity * fadeOpacity);
}
