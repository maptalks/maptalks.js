#define HAS_HIGHLIGHT_COLOR_POINT 1
#define SDF_PX 8.0
#define DEVICE_PIXEL_RATIO 1.0
#define EDGE_GAMMA 0.105 / DEVICE_PIXEL_RATIO

uniform sampler2D glyphTex;
uniform float textOpacity;
uniform highp float gammaScale;
uniform float isHalo;
uniform highp float textHaloBlur;

#if defined(HAS_TEXT_HALO_OPACITY) || defined(HAS_TEXT_HALO_RADIUS)
    varying vec2 vTextHalo;
#endif
#ifndef HAS_TEXT_HALO_OPACITY
    uniform float textHaloOpacity;
#endif
#ifndef HAS_TEXT_HALO_RADIUS
    uniform highp float textHaloRadius;
#endif
varying float vTextSize;
varying float vGammaScale;

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

vec4 renderText(vec2 texCoord) {
    #ifdef HAS_TEXT_FILL
        vec4 myTextFill = vTextFill;
    #else
        vec4 myTextFill = textFill;
    #endif
    float fontScale = vTextSize / 24.0;

    vec4 color = myTextFill;
    highp float gamma = EDGE_GAMMA / (fontScale * gammaScale);
    lowp float buff = 185.0 / 256.0;//(256.0 - 64.0) / 256.0;
    bool isHaloText;
    #ifdef HAS_HALO_ATTR
        // text halo in icon
        isHaloText = vHalo > 0.5;
    #else
        isHaloText = isHalo == 1.0;
    #endif
    if (isHaloText) {
        #ifdef HAS_TEXT_HALO_FILL
            vec4 haloFill = vTextHaloFill;
        #else
            vec4 haloFill = textHaloFill;
        #endif
        #ifdef HAS_TEXT_HALO_RADIUS
            float haloRadius = vTextHalo.x;
        #else
            float haloRadius = textHaloRadius;
        #endif
        if (haloRadius == 0.0) {
            discard;
        }
        color = haloFill;
        gamma = (textHaloBlur * 1.19 / SDF_PX + EDGE_GAMMA) / (fontScale * gammaScale);
        buff = (6.0 - haloRadius / fontScale) / SDF_PX;
        #ifdef HAS_TEXT_HALO_OPACITY
            float haloOpacity = vTextHalo.y / 255.0;
        #else
            float haloOpacity = textHaloOpacity;
        #endif

        color *= haloOpacity * 1.25;
    }

    float dist = texture2D(glyphTex, texCoord).a;
    highp float gammaScaled = gamma * vGammaScale * 0.7;

    float alpha = clamp(smoothstep(buff - gammaScaled, buff + gammaScaled, dist), 0.0, 1.0);
    // float alpha = smoothstep(buff - gammaScaled, buff + gammaScaled, dist);
    // gl_FragColor = vec4(textFill.rgb, alpha * textFill.a);
    return color * (alpha * textOpacity);
}
