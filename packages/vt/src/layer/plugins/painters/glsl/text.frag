#define SHADER_NAME TEXT_FRAG
#define HAS_HIGHLIGHT_COLOR_POINT 1
#define SDF_PX 8.0
#define DEVICE_PIXEL_RATIO 1.0
#define EDGE_GAMMA 0.105 / DEVICE_PIXEL_RATIO

precision mediump float;

uniform sampler2D texture;
uniform float textOpacity;
uniform highp float gammaScale;
uniform int isHalo;
uniform highp float textHaloBlur;
uniform float alphaTest;
#ifdef HAS_TEXT_HALO_OPACITY
    varying float vTextHaloOpacity;
#else
    uniform float textHaloOpacity;
#endif
uniform float layerOpacity;

varying vec2 vTexCoord;
varying float vSize;
varying float vGammaScale;
varying float vOpacity;

#ifdef HAS_TEXT_FILL
    varying vec4 vTextFill;
#else
    uniform vec4 textFill;
#endif

#ifdef HAS_TEXT_HALO_FILL
    varying vec4 vTextHaloFill;
#else
    uniform vec4 textHaloFill;
#endif

#ifdef HAS_TEXT_HALO_RADIUS
    varying float vTextHaloRadius;
#else
    uniform highp float textHaloRadius;
#endif

#include <highlight_frag>

void main() {
    #ifdef HAS_TEXT_FILL
        vec4 myTextFill = vTextFill;
    #else
        vec4 myTextFill = textFill;
    #endif
    float fontScale = vSize / 24.0;

    lowp vec4 color = myTextFill;
    highp float gamma = EDGE_GAMMA / (fontScale * gammaScale);
    lowp float buff = 185.0 / 256.0;//(256.0 - 64.0) / 256.0;
    if (isHalo == 1) {
        #ifdef HAS_TEXT_HALO_FILL
            vec4 haloFill = vTextHaloFill;
        #else
            vec4 haloFill = textHaloFill;
        #endif
        #ifdef HAS_TEXT_HALO_RADIUS
            float haloRadius = vTextHaloRadius;
        #else
            float haloRadius = textHaloRadius;
        #endif
        color = haloFill;
        gamma = (textHaloBlur * 1.19 / SDF_PX + EDGE_GAMMA) / (fontScale * gammaScale);
        buff = (6.0 - haloRadius / fontScale) / SDF_PX;
        #ifdef HAS_TEXT_HALO_OPACITY
            float haloOpacity = vTextHaloOpacity / 255.0;
        #else
            float haloOpacity = textHaloOpacity;
        #endif
        color *= haloOpacity * 1.25;
    }

    float dist = texture2D(texture, vTexCoord).a;
    highp float gammaScaled = gamma * vGammaScale * 0.7;

    float alpha = clamp(smoothstep(buff - gammaScaled, buff + gammaScaled, dist), 0.0, 1.0);
    // float alpha = smoothstep(buff - gammaScaled, buff + gammaScaled, dist);
    // gl_FragColor = vec4(textFill.rgb, alpha * textFill.a);
    gl_FragColor = color * (alpha * textOpacity * vOpacity * layerOpacity);
    if (gl_FragColor.a < alphaTest) {
        discard;
    }
    gl_FragColor = highlight_blendColor(gl_FragColor);
}
