#define DEVICE_PIXEL_RATIO 1.0

precision highp float;

uniform lowp float lineBlur;
uniform lowp float lineOpacity;
uniform lowp vec4 lineColor;

#ifdef HAS_PATTERN
    uniform sampler2D linePatternFile;
    uniform vec2 linePatternSize;

    varying float vZoomScale;
    varying vec2 vExtrudeOffset;
    varying float vDirection;
#endif
varying vec2 vNormal;
varying vec2 vWidth;
varying float vGammaScale;
varying vec2 vPosition;
varying highp float vLinesofar;
uniform vec4 lineDasharray;
uniform vec4 lineDashColor;
uniform float tileExtent;

float dashAntialias(float dashMod, float dashWidth) {
    //dash两边的反锯齿
    float dashHalf = dashWidth / 2.0;
    float dashDist = abs(dashMod - dashHalf);
    float blur2 = (0.1 + 1.0 / DEVICE_PIXEL_RATIO) * vGammaScale;
    return clamp(min(dashDist + blur2, dashHalf - dashDist) / blur2, 0.0, 1.0);
}

void main() {
    //当position的x, y超出tileExtent时，丢弃该片元
    float clip = sign(tileExtent - min(tileExtent, abs(vPosition.x))) * sign(1.0 + sign(vPosition.x)) *
        sign(tileExtent - min(tileExtent, abs(vPosition.y))) * sign(1.0 + sign(vPosition.y));
    if (clip == 0.0) {
        discard;
    }

    float dist = length(vNormal) * vWidth.s;//outset

    float blur2 = (lineBlur + 1.0 / DEVICE_PIXEL_RATIO) * vGammaScale;
    float alpha = clamp(min(dist - (vWidth.t - blur2), vWidth.s - dist) / blur2, 0.0, 1.0);
    #ifdef HAS_PATTERN
        float patternWidth = ceil(linePatternSize.x * vWidth.s * 2.0 / linePatternSize.y);
        //vDirection在前后端点都是1(right)时，值为1，在前后端点一个1一个-1(left)时，值为-1到1之间，因此 0.9999 - abs(vDirection) > 0 说明是左右，< 0 说明都为右
        float x = (vLinesofar * vZoomScale - sign(0.9999 - abs(vDirection)) * vExtrudeOffset.x * vWidth.s) / patternWidth;
        float y = (vNormal.y + 1.0) / 2.0;
        vec4 color = texture2D(linePatternFile, vec2(x, y));
    #else
        vec4 color = lineColor * alpha;
    #endif

    if (length(lineDasharray) > 0.0) {
        float dashWidth = lineDasharray[0] + lineDasharray[1] + lineDasharray[2] + lineDasharray[3];
        float dashMod = mod(vLinesofar, dashWidth);
        //判断是否在第一个dash中
        float firstInDash = max(sign(lineDasharray[0] - dashMod), 0.0);
        //判断是否在第二个dash中
        float secondDashMod = dashMod - lineDasharray[0] - lineDasharray[1];
        float secondInDash = max(sign(secondDashMod), 0.0) * max(sign(lineDasharray[2] - secondDashMod), 0.0);

        float isInDash = firstInDash + secondInDash;

        color = mix(color, lineDashColor * alpha, isInDash);

        //dash两边的反锯齿
        float firstDashAlpha = dashAntialias(dashMod, lineDasharray[0]);
        float secondDashAlpha = dashAntialias(secondDashMod, lineDasharray[2]);;

        color *= mix(1.0, firstDashAlpha * firstInDash + secondDashAlpha * secondDashAlpha, isInDash);
    }

    gl_FragColor = color * lineOpacity;
}
