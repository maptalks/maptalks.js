#define DEVICE_PIXEL_RATIO 1.0

precision highp float;

#if defined(HAS_SHADOWING)
    #include <vsm_shadow_frag>
#endif

uniform lowp float lineBlur;

#ifdef HAS_COLOR
    varying vec4 vColor;
#else
    uniform lowp vec4 lineColor;
#endif

#ifdef HAS_OPACITY
    varying float vOpacity;
#else
    uniform lowp float lineOpacity;
#endif

#ifdef HAS_PATTERN
    uniform sampler2D linePatternFile;
    uniform vec2 linePatternSize;

#endif
varying vec2 vNormal;
varying vec2 vWidth;
varying float vGammaScale;
#ifndef ENABLE_TILE_STENCIL
    varying vec2 vPosition;
#endif

uniform float tileExtent;
#ifdef HAS_DASHARRAY
    uniform vec4 lineDasharray;
    uniform vec4 lineDashColor;
#endif
#if defined(HAS_PATTERN) || defined(HAS_DASHARRAY) || defined(HAS_GRADIENT) || defined(HAS_TRAIL)
    varying highp float vLinesofar;
#endif

#ifdef HAS_TRAIL
    uniform float trailSpeed;
    uniform float trailLength;
    uniform float trailCircle;
    uniform float currentTime;
#endif

float dashAntialias(float dashMod, float dashWidth) {
    //dash两边的反锯齿
    float dashHalf = dashWidth / 2.0;
    float dashDist = abs(dashMod - dashHalf);
    float blur2 = (0.1 + 1.0 / DEVICE_PIXEL_RATIO) * vGammaScale;
    return clamp(min(dashDist + blur2, dashHalf - dashDist) / blur2, 0.0, 1.0);
}

void main() {
    #ifndef ENABLE_TILE_STENCIL
    //当position的x, y超出tileExtent时，丢弃该片元
        float clip = sign(tileExtent - min(tileExtent, abs(vPosition.x))) * sign(1.0 + sign(vPosition.x)) *
            sign(tileExtent - min(tileExtent, abs(vPosition.y))) * sign(1.0 + sign(vPosition.y));
        if (clip == 0.0) {
            discard;
        }
    #endif

    float dist = length(vNormal) * vWidth.s;//outset

    float blur2 = (lineBlur + 1.0 / DEVICE_PIXEL_RATIO) * vGammaScale;
    float alpha = clamp(min(dist - (vWidth.t - blur2), vWidth.s - dist) / blur2, 0.0, 1.0);
    #ifdef HAS_PATTERN
        float patternWidth = ceil(linePatternSize.x * vWidth.s * 2.0 / linePatternSize.y);
        //vDirection在前后端点都是1(right)时，值为1，在前后端点一个1一个-1(left)时，值为-1到1之间，因此 0.9999 - abs(vDirection) > 0 说明是左右，< 0 说明都为右
        float x = vLinesofar / patternWidth;
        float y = (vNormal.y + 1.0) / 2.0;
        vec4 color = texture2D(linePatternFile, vec2(x, y));
    #else
        #ifdef HAS_COLOR
            vec4 color = vColor / 255.0 * alpha;
        #else
            vec4 color = lineColor * alpha;
        #endif
    #endif

    #ifdef HAS_DASHARRAY
        float dashWidth = lineDasharray[0] + lineDasharray[1] + lineDasharray[2] + lineDasharray[3];
        float dashMod = mod(vLinesofar, dashWidth);
        //判断是否在第一个dash中
        float firstInDash = max(sign(lineDasharray[0] - dashMod), 0.0);
        //判断是否在第二个dash中
        float secondDashMod = dashMod - lineDasharray[0] - lineDasharray[1];
        float secondInDash = max(sign(secondDashMod), 0.0) * max(sign(lineDasharray[2] - secondDashMod), 0.0);

        float isInDash = firstInDash + secondInDash;

        //dash两边的反锯齿
        float firstDashAlpha = dashAntialias(dashMod, lineDasharray[0]);
        float secondDashAlpha = dashAntialias(secondDashMod, lineDasharray[2]);

        float dashAlpha = firstDashAlpha * firstInDash + secondDashAlpha * secondInDash;

        color = alpha * (color * (1.0 - dashAlpha) + lineDashColor * dashAlpha);
    #endif

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
