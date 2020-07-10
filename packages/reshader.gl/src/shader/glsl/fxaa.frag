/* https://github.com/mitsuhiko/webgl-meincraft */

/* Basic FXAA implementation based on the code on geeks3d.com with the
   modification that the texture2DLod stuff was removed since it's
   unsupported by WebGL. */

#define SHADER_NAME FXAA
#define FXAA_REDUCE_MIN   (1.0/ 128.0)
#define FXAA_REDUCE_MUL   (1.0 / 8.0)
#define FXAA_SPAN_MAX     8.0

precision mediump float;

varying vec2 vTexCoord;


uniform float enableFXAA;
uniform float enableToneMapping;
uniform float enableSharpen;
uniform vec2 resolution;
uniform sampler2D textureSource;
uniform sampler2D noAaTextureSource;
uniform float pixelRatio;
uniform float sharpFactor;//0 - 5

uniform sampler2D textureOutline;
uniform float enableOutline;
uniform float highlightFactor;
uniform float outlineFactor;
uniform float outlineWidth;
uniform vec3 outlineColor;

vec2 gTexCoord;
vec2 uTextureInputSize;
vec2 uTextureInputRatio;


vec4 applyFXAA(vec2 fragCoord, sampler2D tex)
{
    vec4 color;
  mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);
  vec3 rgbNW = texture2D(tex, (fragCoord + vec2(-1.0, -1.0)) * inverseVP).xyz;
  vec3 rgbNE = texture2D(tex, (fragCoord + vec2(1.0, -1.0)) * inverseVP).xyz;
  vec3 rgbSW = texture2D(tex, (fragCoord + vec2(-1.0, 1.0)) * inverseVP).xyz;
  vec3 rgbSE = texture2D(tex, (fragCoord + vec2(1.0, 1.0)) * inverseVP).xyz;
  vec4 texColor = texture2D(tex, fragCoord  * inverseVP);
  vec3 rgbM  = texColor.xyz;
  vec3 luma = vec3(0.299, 0.587, 0.114);
  float lumaNW = dot(rgbNW, luma);
  float lumaNE = dot(rgbNE, luma);
  float lumaSW = dot(rgbSW, luma);
  float lumaSE = dot(rgbSE, luma);
  float lumaM  = dot(rgbM,  luma);
  float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
  float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

  mediump vec2 dir;
  dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
  dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

  float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                        (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
  dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
            max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
            dir * rcpDirMin)) * inverseVP;

  vec4 rgbA = 0.5 * (
      texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)) +
      texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)));
  vec4 rgbB = rgbA * 0.5 + 0.25 * (
      texture2D(tex, fragCoord * inverseVP + dir * -0.5) +
      texture2D(tex, fragCoord * inverseVP + dir * 0.5));

  float lumaB = dot(rgbB.xyz, luma);
  if ((lumaB < lumaMin) || (lumaB > lumaMax))
      color = rgbA;
  else
      color = rgbB;
  return color;
}

// vec4 fxaa(sampler2D TextureInput) {
//     vec2 fxaaQualityRcpFrame = 1.0 / uTextureInputSize;
//     float fxaaQualitySubpix = 0.75;
//     float fxaaQualityEdgeThreshold = 0.125;
//     float fxaaQualityEdgeThresholdMin = 0.0625;
//     vec2 posM = gTexCoord;
//     vec4 rgbyM = (texture2D(TextureInput, (min(posM, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
//     float lumaM = rgbyM.y;
//     vec4 sw = vec4(-1.0, 1.0, 1.0, -1.0) * fxaaQualityRcpFrame.xxyy;
//     float lumaS = (texture2D(TextureInput, (min(posM + vec2(0.0, sw.z), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//     float lumaE = (texture2D(TextureInput, (min(posM + vec2(sw.y, 0.0), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//     float lumaN = (texture2D(TextureInput, (min(posM + vec2(0.0, sw.w), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//     float lumaW = (texture2D(TextureInput, (min(posM + vec2(sw.x, 0.0), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//     float maxSM = max(lumaS, lumaM);
//     float minSM = min(lumaS, lumaM);
//     float maxESM = max(lumaE, maxSM);
//     float minESM = min(lumaE, minSM);
//     float maxWN = max(lumaN, lumaW);
//     float minWN = min(lumaN, lumaW);
//     float rangeMax = max(maxWN, maxESM);
//     float rangeMin = min(minWN, minESM);
//     float rangeMaxScaled = rangeMax * fxaaQualityEdgeThreshold;
//     float range = rangeMax - rangeMin;
//     float rangeMaxClamped = max(fxaaQualityEdgeThresholdMin, rangeMaxScaled);
//     bool earlyExit = range < rangeMaxClamped;
//     if (earlyExit) return rgbyM;
//     float lumaNW = (texture2D(TextureInput, (min(posM + sw.xw, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//     float lumaSE = (texture2D(TextureInput, (min(posM + sw.yz, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//     float lumaNE = (texture2D(TextureInput, (min(posM + sw.yw, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//     float lumaSW = (texture2D(TextureInput, (min(posM + sw.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//     float lumaNS = lumaN + lumaS;
//     float lumaWE = lumaW + lumaE;
//     float subpixRcpRange = 1.0/range;
//     float subpixNSWE = lumaNS + lumaWE;
//     float edgeHorz1 = (-2.0 * lumaM) + lumaNS;
//     float edgeVert1 = (-2.0 * lumaM) + lumaWE;
//     float lumaNESE = lumaNE + lumaSE;
//     float lumaNWNE = lumaNW + lumaNE;
//     float edgeHorz2 = (-2.0 * lumaE) + lumaNESE;
//     float edgeVert2 = (-2.0 * lumaN) + lumaNWNE;
//     float lumaNWSW = lumaNW + lumaSW;
//     float lumaSWSE = lumaSW + lumaSE;
//     float edgeHorz4 = (abs(edgeHorz1) * 2.0) + abs(edgeHorz2);
//     float edgeVert4 = (abs(edgeVert1) * 2.0) + abs(edgeVert2);
//     float edgeHorz3 = (-2.0 * lumaW) + lumaNWSW;
//     float edgeVert3 = (-2.0 * lumaS) + lumaSWSE;
//     float edgeHorz = abs(edgeHorz3) + edgeHorz4;
//     float edgeVert = abs(edgeVert3) + edgeVert4;
//     float subpixNWSWNESE = lumaNWSW + lumaNESE;
//     float lengthSign = fxaaQualityRcpFrame.x;
//     bool horzSpan = edgeHorz >= edgeVert;
//     float subpixA = subpixNSWE * 2.0 + subpixNWSWNESE;
//     if(!horzSpan) lumaN = lumaW;
//     if(!horzSpan) lumaS = lumaE;
//     if(horzSpan) lengthSign = fxaaQualityRcpFrame.y;
//     float subpixB = (subpixA * (1.0/12.0)) - lumaM;
//     float gradientN = lumaN - lumaM;
//     float gradientS = lumaS - lumaM;
//     float lumaNN = lumaN + lumaM;
//     float lumaSS = lumaS + lumaM;
//     bool pairN = abs(gradientN) >= abs(gradientS);
//     float gradient = max(abs(gradientN), abs(gradientS));
//     if(pairN) lengthSign = -lengthSign;
//     float subpixC = clamp(abs(subpixB) * subpixRcpRange, 0.0, 1.0);
//     vec2 posB = posM.xy;
//     vec2 offNP;
//     offNP.x = (!horzSpan) ? 0.0 : fxaaQualityRcpFrame.x;
//     offNP.y = ( horzSpan) ? 0.0 : fxaaQualityRcpFrame.y;
//     if(!horzSpan) posB.x += lengthSign * 0.5;
//     if( horzSpan) posB.y += lengthSign * 0.5;
//     vec2 posN;
//     posN.x = posB.x - offNP.x;
//     posN.y = posB.y - offNP.y;
//     vec2 posP;
//     posP.x = posB.x + offNP.x;
//     posP.y = posB.y + offNP.y;
//     float subpixD = ((-2.0)*subpixC) + 3.0;
//     float lumaEndN = (texture2D(TextureInput, (min(posN, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//     float subpixE = subpixC * subpixC;
//     float lumaEndP = (texture2D(TextureInput, (min(posP, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//     if(!pairN) lumaNN = lumaSS;
//     float gradientScaled = gradient * 1.0/4.0;
//     float lumaMM = lumaM - lumaNN * 0.5;
//     float subpixF = subpixD * subpixE;
//     bool lumaMLTZero = lumaMM < 0.0;
//     lumaEndN -= lumaNN * 0.5;
//     lumaEndP -= lumaNN * 0.5;
//     bool doneN = abs(lumaEndN) >= gradientScaled;
//     bool doneP = abs(lumaEndP) >= gradientScaled;
//     if(!doneN) posN.x -= offNP.x * 1.5;
//     if(!doneN) posN.y -= offNP.y * 1.5;
//     bool doneNP = (!doneN) || (!doneP);
//     if(!doneP) posP.x += offNP.x * 1.5;
//     if(!doneP) posP.y += offNP.y * 1.5;
//     if(doneNP) {
//         if(!doneN) lumaEndN = (texture2D(TextureInput, (min(posN.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//         if(!doneP) lumaEndP = (texture2D(TextureInput, (min(posP.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//         if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
//         if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
//         doneN = abs(lumaEndN) >= gradientScaled;
//         doneP = abs(lumaEndP) >= gradientScaled;
//         if(!doneN) posN.x -= offNP.x * 2.0;
//         if(!doneN) posN.y -= offNP.y * 2.0;
//         doneNP = (!doneN) || (!doneP);
//         if(!doneP) posP.x += offNP.x * 2.0;
//         if(!doneP) posP.y += offNP.y * 2.0;
//         if(doneNP) {
//             if(!doneN) lumaEndN = (texture2D(TextureInput, (min(posN.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//             if(!doneP) lumaEndP = (texture2D(TextureInput, (min(posP.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//             if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
//             if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
//             doneN = abs(lumaEndN) >= gradientScaled;
//             doneP = abs(lumaEndP) >= gradientScaled;
//             if(!doneN) posN.x -= offNP.x * 4.0;
//             if(!doneN) posN.y -= offNP.y * 4.0;
//             doneNP = (!doneN) || (!doneP);
//             if(!doneP) posP.x += offNP.x * 4.0;
//             if(!doneP) posP.y += offNP.y * 4.0;
//             if(doneNP) {
//                 if(!doneN) lumaEndN = (texture2D(TextureInput, (min(posN.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//                 if(!doneP) lumaEndP = (texture2D(TextureInput, (min(posP.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
//                 if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
//                 if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
//                 doneN = abs(lumaEndN) >= gradientScaled;
//                 doneP = abs(lumaEndP) >= gradientScaled;
//                 if(!doneN) posN.x -= offNP.x * 12.0;
//                 if(!doneN) posN.y -= offNP.y * 12.0;
//                 doneNP = (!doneN) || (!doneP);
//                 if(!doneP) posP.x += offNP.x * 12.0;
//                 if(!doneP) posP.y += offNP.y * 12.0;
//             }

//         }

//     }
//     float dstN = posM.x - posN.x;
//     float dstP = posP.x - posM.x;
//     if(!horzSpan) dstN = posM.y - posN.y;
//     if(!horzSpan) dstP = posP.y - posM.y;
//     bool goodSpanN = (lumaEndN < 0.0) != lumaMLTZero;
//     float spanLength = (dstP + dstN);
//     bool goodSpanP = (lumaEndP < 0.0) != lumaMLTZero;
//     float spanLengthRcp = 1.0/spanLength;
//     bool directionN = dstN < dstP;
//     float dst = min(dstN, dstP);
//     bool goodSpan = directionN ? goodSpanN : goodSpanP;
//     float subpixG = subpixF * subpixF;
//     float pixelOffset = (dst * (-spanLengthRcp)) + 0.5;
//     float subpixH = subpixG * fxaaQualitySubpix;
//     float pixelOffsetGood = goodSpan ? pixelOffset : 0.0;
//     float pixelOffsetSubpix = max(pixelOffsetGood, subpixH);
//     if(!horzSpan) posM.x += pixelOffsetSubpix * lengthSign;
//     if( horzSpan) posM.y += pixelOffsetSubpix * lengthSign;
//     return  (texture2D(TextureInput, (min(posM, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
// }

//---------------sharpen-----------------------
vec3 sharpColorFactor(const in vec3 color, const float sharp) {
    vec2 off = pixelRatio / uTextureInputSize.xy;
    float count = 0.0;
    vec4 rgbNW = texture2D(textureSource, gTexCoord + off * vec2(-1.0, -1.0));
    rgbNW.rgb = mix(vec3(0.0), rgbNW.rgb, sign(rgbNW.a));
    count += mix(0.0, 1.0, sign(rgbNW.a));
    vec4 rgbSE = texture2D(textureSource, gTexCoord + off * vec2(1.0, 1.0));
    rgbSE.rgb = mix(vec3(0.0), rgbSE.rgb, sign(rgbSE.a));
    count += mix(0.0, 1.0, sign(rgbSE.a));
    vec4 rgbNE = texture2D(textureSource, gTexCoord + off * vec2(1.0, -1.0));
    rgbNE.rgb = mix(vec3(0.0), rgbNE.rgb, sign(rgbNE.a));
    count += mix(0.0, 1.0, sign(rgbNE.a));
    vec4 rgbSW = texture2D(textureSource, gTexCoord + off * vec2(-1.0, 1.0));
    rgbSW.rgb = mix(vec3(0.0), rgbSW.rgb, sign(rgbSW.a));
    count += mix(0.0, 1.0, sign(rgbSW.a));
    return color + sharp * (count * color - rgbNW.rgb - rgbNE.rgb - rgbSW.rgb - rgbSE.rgb);
}
vec4 sharpen(const in vec4 color) {
    return vec4(sharpColorFactor(color.rgb, sharpFactor), color.a);
}

//---------------tone mapping-------------------
vec3 HDR_ACES(const vec3 x) {
    // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

vec3 tonemap(vec3 color) {
    // vec3 c = color;
    // c = HDR_ACES(c);
    // c = pow(c, vec3(1.0/2.2));
    // return c;
    // HDR tonemapping
    color = color / (color + vec3(1.0));
    // gamma correct
    return color = pow(color, vec3(1.0/2.2));
}

vec4 outline() {
    float fac0 = 2.0;
    float fac1 = 1.0;
    float offsetx = pixelRatio / resolution[0] * outlineWidth;
    float offsety = pixelRatio / resolution[1] * outlineWidth;
    vec4 texel0 = (texture2D(textureOutline, gTexCoord + vec2(offsetx, offsety)));
    vec4 texel1 = (texture2D(textureOutline, gTexCoord + vec2(offsetx, 0.0)));
    vec4 texel2 = (texture2D(textureOutline, gTexCoord + vec2(offsetx, -offsety)));
    vec4 texel3 = (texture2D(textureOutline, gTexCoord + vec2(0.0, -offsety)));
    vec4 texel4 = (texture2D(textureOutline, gTexCoord + vec2(-offsetx, -offsety)));
    vec4 texel5 = (texture2D(textureOutline, gTexCoord + vec2(-offsetx, 0.0)));
    vec4 texel6 = (texture2D(textureOutline, gTexCoord + vec2(-offsetx, offsety)));
    vec4 texel7 = (texture2D(textureOutline, gTexCoord + vec2(0.0, offsety)));
    vec4 rowx = -fac0 * texel5 + fac0 * texel1 + -fac1 * texel6 + fac1 * texel0 + -fac1 * texel4 + fac1 * texel2;
    vec4 rowy = -fac0 * texel3 + fac0 * texel7 + -fac1 * texel4 + fac1 * texel6 + -fac1 * texel2 + fac1 * texel0;
    float magSqr = sqrt(dot(rowy, rowy) + dot(rowx, rowx));
    bool infMag = magSqr < 1.0 / 65025.0;
    vec3 texelCenter = (texture2D(textureOutline, gTexCoord)).r * outlineColor;
    if (texelCenter == vec3(0.0) || (highlightFactor == 0.0 && infMag)) {
        return vec4(0.0);
    }
    float finalFactor = infMag ? highlightFactor : min(1.0, sqrt(magSqr) * outlineFactor);
    return finalFactor * vec4(texelCenter, 1.0);
}

vec4 composeOutline(const in vec4 color) {
    vec4 outline = outline();
    return outline + vec4(color) * (1.0 - outline.a);
}

void main() {
    uTextureInputSize = resolution;
    uTextureInputRatio = vec2(1.0, 1.0);
    gTexCoord = vTexCoord;
    // gl_FragColor = FxaaPixelShader(
    //     vTexCoord, vec4(0.0), textureSource, textureSource, textureSource, 1.0 / resolution, vec4(0.0), vec4(0.0), vec4(0.0), 0.75, 0.166, 0.0833, 0.0, 0.0, 0.0, vec4(0.0)
    // );
    vec4 color;
    if (enableFXAA == 1.0) {
        // color = fxaa(textureSource);
        color = applyFXAA(gTexCoord * resolution, textureSource);
    } else {
        color = texture2D(textureSource, vTexCoord);
    }
    if (enableSharpen == 1.0) {
        color = sharpen(color);
    }
    vec4 color1 = texture2D(noAaTextureSource, vTexCoord);
    color = color1 * color1.a + color * (1.0 - color1.a);

    if (enableToneMapping == 1.0) {
        color.rgb = tonemap(color.rgb);
    }
    if (enableOutline == 1.0) {
        color = composeOutline(color);
    }
    gl_FragColor = color;
}
