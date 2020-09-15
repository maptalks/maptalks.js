#define SHADER_NAME LINE
#define DEVICE_PIXEL_RATIO 1.0

precision highp float;

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
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
    uniform vec2 atlasSize;
    uniform float flipY;
    uniform float linePatternAnimSpeed;

    varying vec4 vTexInfo;
    vec2 computeUV(vec2 texCoord) {
        vec2 uv = mod(texCoord, 1.0);
        vec2 uvStart = vTexInfo.xy;
        vec2 uvSize = vTexInfo.zw;
        return (uvStart + uv * uvSize) / atlasSize;
    }
#endif
varying vec2 vNormal;
varying vec2 vWidth;
varying float vGammaScale;
#ifndef ENABLE_TILE_STENCIL
    varying vec2 vPosition;
#endif

uniform float tileExtent;
#ifdef HAS_DASHARRAY
    #ifdef HAS_DASHARRAY_ATTR
        varying vec4 vDasharray;
    #else
        uniform vec4 lineDasharray;
    #endif

    #ifdef HAS_DASHARRAY_COLOR
        varying vec4 vDashColor;
    #else
        uniform vec4 lineDashColor;
    #endif
#endif
#if defined(HAS_PATTERN) || defined(HAS_DASHARRAY) || defined(HAS_GRADIENT) || defined(HAS_TRAIL)
    varying highp float vLinesofar;
#endif

#ifdef HAS_TRAIL
    uniform float trailSpeed;
    uniform float trailLength;
    uniform float trailCircle;
#endif

#if defined(HAS_TRAIL) || defined(HAS_PATTERN)
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
    #if defined(HAS_PATTERN) || defined(HAS_DASHARRAY) || defined(HAS_GRADIENT) || defined(HAS_TRAIL)
        float linesofar = vLinesofar;
    #endif

    //outset
    float dist = length(vNormal) * vWidth.s;

    float blur2 = (lineBlur + 1.0 / DEVICE_PIXEL_RATIO) * vGammaScale;
    float alpha = clamp(min(dist - (vWidth.t - blur2), vWidth.s - dist) / blur2, 0.0, 1.0);
    #ifdef HAS_COLOR
        vec4 color = vColor / 255.0 * alpha;
    #else
        vec4 color = lineColor * alpha;
    #endif
    #ifdef HAS_PATTERN
        vec2 uvSize = vTexInfo.zw;
        if (uvSize.x * uvSize.y > 1.0) {
            float patternWidth = ceil(uvSize.x * vWidth.s * 2.0 / uvSize.y);
            linesofar += mod(currentTime * -linePatternAnimSpeed * 0.1, patternWidth);
            //vDirection在前后端点都是1(right)时，值为1，在前后端点一个1一个-1(left)时，值为-1到1之间，因此 0.9999 - abs(vDirection) > 0 说明是左右，< 0 说明都为右
            float patternx = mod(linesofar / patternWidth, 1.0);
            float patterny = mod((flipY * vNormal.y + 1.0) / 2.0, 1.0);
            color = texture2D(linePatternFile, computeUV(vec2(patternx, patterny)));
        }
    #endif

    #ifdef HAS_DASHARRAY
        #ifdef HAS_DASHARRAY_ATTR
            vec4 dasharray = vDasharray;
        #else
            vec4 dasharray = lineDasharray;
        #endif

        #ifdef HAS_DASHARRAY_COLOR
            vec4 dashColor = vDashColor;
        #else
            vec4 dashColor = lineDashColor;
        #endif

        float dashWidth = dasharray[0] + dasharray[1] + dasharray[2] + dasharray[3];
        float dashMod = mod(linesofar, dashWidth);
        //判断是否在第一个dash中
        float firstInDash = max(sign(dasharray[0] - dashMod), 0.0);
        //判断是否在第二个dash中
        float secondDashMod = dashMod - dasharray[0] - dasharray[1];
        float secondInDash = max(sign(secondDashMod), 0.0) * max(sign(dasharray[2] - secondDashMod), 0.0);

        float isInDash = firstInDash + secondInDash;

        //dash两边的反锯齿
        float firstDashAlpha = dashAntialias(dashMod, dasharray[0]);
        float secondDashAlpha = dashAntialias(secondDashMod, dasharray[2]);

        float dashAlpha = firstDashAlpha * firstInDash + secondDashAlpha * secondInDash;
        color = color * (1.0 - dashAlpha) + alpha * dashColor * dashAlpha;
    #endif

    #ifdef HAS_TRAIL
        float trailMod = mod(linesofar - currentTime * trailSpeed * 0.1, trailCircle);
        float trailAlpha = trailMod < trailLength ? mix(0.0, 1.0, trailMod / trailLength) : 0.0;
        color *= trailAlpha;
    #endif

    #ifdef HAS_OPACITY
        float opacity = vOpacity;
    #else
        float opacity = lineOpacity;
    #endif
    gl_FragColor = color * opacity;

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        gl_FragColor.rgb = shadow_blend(gl_FragColor.rgb, shadowCoeff);
    #endif
}
