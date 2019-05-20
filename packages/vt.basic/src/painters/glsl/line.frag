#define DEVICE_PIXEL_RATIO 1.0

precision highp float;

uniform lowp float lineBlur;
uniform lowp float lineOpacity;
uniform lowp vec4 lineColor;

varying vec2 vNormal;
varying vec2 vWidth;
varying float vGammaScale;
varying highp float vLinesofar;
uniform vec4 lineDasharray;
uniform vec4 lineDashColor;

void main() {
    float dist = length(vNormal) * vWidth.s;//outset

    float blur2 = (lineBlur + 1.0 / DEVICE_PIXEL_RATIO) * vGammaScale;
    float alpha = clamp(min(dist - (vWidth.t - blur2), vWidth.s - dist) / blur2, 0.0, 1.0);
    vec4 color = lineColor * alpha;

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
        float dashHalf = lineDasharray[0] / 2.0;
        float dashDist = abs(dashMod - dashHalf);
        blur2 = (0.1 + 1.0 / DEVICE_PIXEL_RATIO) * vGammaScale;
        float firstDashAlpha = clamp(min(dashDist + blur2, dashHalf - dashDist) / blur2, 0.0, 1.0);

        dashHalf = lineDasharray[2] / 2.0;
        dashDist = abs(secondDashMod - dashHalf);
        blur2 = (0.1 + 1.0 / DEVICE_PIXEL_RATIO) * vGammaScale;
        float secondDashAlpha = clamp(min(dashDist + blur2, dashHalf - dashDist) / blur2, 0.0, 1.0);

        color *= mix(1.0, firstDashAlpha * firstInDash + secondDashAlpha * secondDashAlpha, isInDash);
    }

    gl_FragColor = color * lineOpacity;
}
