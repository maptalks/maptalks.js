#define DEVICE_PIXEL_RATIO 1.0
#define MAX_LINE_COUNT 128.0

precision mediump float;

#if defined(HAS_SHADOWING)
    #include <vsm_shadow_frag>
#endif

uniform lowp float lineBlur;
uniform lowp float lineOpacity;
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

    gl_FragColor = color * lineOpacity;

    #if defined(HAS_SHADOWING)
        float shadow = shadow_computeShadow();
        gl_FragColor.rgb *= shadow;
    #endif
}
