#define DEVICE_PIXEL_RATIO 1.0
#define MAX_LINE_COUNT 128.0

precision mediump float;

#if defined(HAS_SHADOWING)
    #include <vsm_shadow_frag>
#endif

#ifdef HAS_OPACITY
    varying float vOpacity;
#else
    uniform lowp float lineOpacity;
#endif

uniform lowp float lineBlur;
uniform float lineGradientTextureHeight;
uniform float tileExtent;

uniform sampler2D lineGradientTexture;

varying vec2 vNormal;
varying vec2 vWidth;
varying float vGammaScale;
varying highp float vLinesofar;
varying float vGradIndex;
#ifndef ENABLE_TILE_STENCIL
    varying vec2 vPosition;
#endif

#ifdef HAS_TRAIL
    uniform float trailSpeed;
    uniform float trailLength;
    uniform float trailCircle;
    uniform float currentTime;
#endif

void main() {
        //当position的x, y超出tileExtent时，丢弃该片元
    #ifndef ENABLE_TILE_STENCIL
        float clip = sign(tileExtent - min(tileExtent, abs(vPosition.x))) * sign(1.0 + sign(vPosition.x)) *
            sign(tileExtent - min(tileExtent, abs(vPosition.y))) * sign(1.0 + sign(vPosition.y));
        if (clip == 0.0) {
            discard;
        }
    #endif

    float dist = length(vNormal) * vWidth.s;//outset

    float blur2 = (lineBlur + 1.0 / DEVICE_PIXEL_RATIO) * vGammaScale;
    float alpha = clamp(min(dist - (vWidth.t - blur2), vWidth.s - dist) / blur2, 0.0, 1.0);

    float x = vLinesofar;
    vec4 color = texture2D(lineGradientTexture, vec2(x, (vGradIndex * 2.0 + 0.5) / lineGradientTextureHeight)) * alpha;
    color *= max(sign(MAX_LINE_COUNT - vGradIndex), 0.0); //超过MAX_LINE_COUNT时则不显示

    #ifdef HAS_TRAIL
        if (enableTrail == 1.0) {
            float d = mod(vLinesofar - currentTime * trailSpeed * 0.1, trailCircle);
            float a = d < trailLength ? mix(0.0, 1.0, d / trailLength) : 0.0;
            color *= a;
        }
    #endif

     #ifdef HAS_OPACITY
        float opacity = vOpacity;
    #else
        float opacity = lineOpacity;
    #endif
    gl_FragColor = color * opacity;

    #if defined(HAS_SHADOWING)
        float shadowCoeff = shadow_computeShadow();
        gl_FragColor.rgb = shadow_blend(gl_FragColor.rgb, shadowCoeff);
    #endif
}
