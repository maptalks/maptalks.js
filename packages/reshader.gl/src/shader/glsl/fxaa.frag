precision mediump float;

varying vec2 vTexCoord;


uniform float enableFXAA;
uniform float enableSSAO;
uniform float enableToneMapping;
uniform vec2 resolution;
uniform sampler2D textureSource;
uniform sampler2D ssaoTexture;

uniform float cameraNear;
uniform float cameraFar;

vec2 gTexCoord;
vec2 uTextureInputSize;
vec2 uTextureInputRatio;

vec4 fxaa() {
    vec2 fxaaQualityRcpFrame = 1.0 / uTextureInputSize;
    float fxaaQualitySubpix = 0.75;
    float fxaaQualityEdgeThreshold = 0.125;
    float fxaaQualityEdgeThresholdMin = 0.0625;
    vec2 posM = gTexCoord;
    vec4 rgbyM = (texture2D(textureSource, (min(posM, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
    float lumaM = rgbyM.y;
    vec4 sw = vec4(-1.0, 1.0, 1.0, -1.0) * fxaaQualityRcpFrame.xxyy;
    float lumaS = (texture2D(textureSource, (min(posM + vec2(0.0, sw.z), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
    float lumaE = (texture2D(textureSource, (min(posM + vec2(sw.y, 0.0), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
    float lumaN = (texture2D(textureSource, (min(posM + vec2(0.0, sw.w), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
    float lumaW = (texture2D(textureSource, (min(posM + vec2(sw.x, 0.0), 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
    float maxSM = max(lumaS, lumaM);
    float minSM = min(lumaS, lumaM);
    float maxESM = max(lumaE, maxSM);
    float minESM = min(lumaE, minSM);
    float maxWN = max(lumaN, lumaW);
    float minWN = min(lumaN, lumaW);
    float rangeMax = max(maxWN, maxESM);
    float rangeMin = min(minWN, minESM);
    float rangeMaxScaled = rangeMax * fxaaQualityEdgeThreshold;
    float range = rangeMax - rangeMin;
    float rangeMaxClamped = max(fxaaQualityEdgeThresholdMin, rangeMaxScaled);
    bool earlyExit = range < rangeMaxClamped;
    if (earlyExit) return rgbyM;
    float lumaNW = (texture2D(textureSource, (min(posM + sw.xw, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
    float lumaSE = (texture2D(textureSource, (min(posM + sw.yz, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
    float lumaNE = (texture2D(textureSource, (min(posM + sw.yw, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
    float lumaSW = (texture2D(textureSource, (min(posM + sw.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
    float lumaNS = lumaN + lumaS;
    float lumaWE = lumaW + lumaE;
    float subpixRcpRange = 1.0/range;
    float subpixNSWE = lumaNS + lumaWE;
    float edgeHorz1 = (-2.0 * lumaM) + lumaNS;
    float edgeVert1 = (-2.0 * lumaM) + lumaWE;
    float lumaNESE = lumaNE + lumaSE;
    float lumaNWNE = lumaNW + lumaNE;
    float edgeHorz2 = (-2.0 * lumaE) + lumaNESE;
    float edgeVert2 = (-2.0 * lumaN) + lumaNWNE;
    float lumaNWSW = lumaNW + lumaSW;
    float lumaSWSE = lumaSW + lumaSE;
    float edgeHorz4 = (abs(edgeHorz1) * 2.0) + abs(edgeHorz2);
    float edgeVert4 = (abs(edgeVert1) * 2.0) + abs(edgeVert2);
    float edgeHorz3 = (-2.0 * lumaW) + lumaNWSW;
    float edgeVert3 = (-2.0 * lumaS) + lumaSWSE;
    float edgeHorz = abs(edgeHorz3) + edgeHorz4;
    float edgeVert = abs(edgeVert3) + edgeVert4;
    float subpixNWSWNESE = lumaNWSW + lumaNESE;
    float lengthSign = fxaaQualityRcpFrame.x;
    bool horzSpan = edgeHorz >= edgeVert;
    float subpixA = subpixNSWE * 2.0 + subpixNWSWNESE;
    if(!horzSpan) lumaN = lumaW;
    if(!horzSpan) lumaS = lumaE;
    if(horzSpan) lengthSign = fxaaQualityRcpFrame.y;
    float subpixB = (subpixA * (1.0/12.0)) - lumaM;
    float gradientN = lumaN - lumaM;
    float gradientS = lumaS - lumaM;
    float lumaNN = lumaN + lumaM;
    float lumaSS = lumaS + lumaM;
    bool pairN = abs(gradientN) >= abs(gradientS);
    float gradient = max(abs(gradientN), abs(gradientS));
    if(pairN) lengthSign = -lengthSign;
    float subpixC = clamp(abs(subpixB) * subpixRcpRange, 0.0, 1.0);
    vec2 posB = posM.xy;
    vec2 offNP;
    offNP.x = (!horzSpan) ? 0.0 : fxaaQualityRcpFrame.x;
    offNP.y = ( horzSpan) ? 0.0 : fxaaQualityRcpFrame.y;
    if(!horzSpan) posB.x += lengthSign * 0.5;
    if( horzSpan) posB.y += lengthSign * 0.5;
    vec2 posN;
    posN.x = posB.x - offNP.x;
    posN.y = posB.y - offNP.y;
    vec2 posP;
    posP.x = posB.x + offNP.x;
    posP.y = posB.y + offNP.y;
    float subpixD = ((-2.0)*subpixC) + 3.0;
    float lumaEndN = (texture2D(textureSource, (min(posN, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
    float subpixE = subpixC * subpixC;
    float lumaEndP = (texture2D(textureSource, (min(posP, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
    if(!pairN) lumaNN = lumaSS;
    float gradientScaled = gradient * 1.0/4.0;
    float lumaMM = lumaM - lumaNN * 0.5;
    float subpixF = subpixD * subpixE;
    bool lumaMLTZero = lumaMM < 0.0;
    lumaEndN -= lumaNN * 0.5;
    lumaEndP -= lumaNN * 0.5;
    bool doneN = abs(lumaEndN) >= gradientScaled;
    bool doneP = abs(lumaEndP) >= gradientScaled;
    if(!doneN) posN.x -= offNP.x * 1.5;
    if(!doneN) posN.y -= offNP.y * 1.5;
    bool doneNP = (!doneN) || (!doneP);
    if(!doneP) posP.x += offNP.x * 1.5;
    if(!doneP) posP.y += offNP.y * 1.5;
    if(doneNP) {
        if(!doneN) lumaEndN = (texture2D(textureSource, (min(posN.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
        if(!doneP) lumaEndP = (texture2D(textureSource, (min(posP.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
        if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
        if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
        doneN = abs(lumaEndN) >= gradientScaled;
        doneP = abs(lumaEndP) >= gradientScaled;
        if(!doneN) posN.x -= offNP.x * 2.0;
        if(!doneN) posN.y -= offNP.y * 2.0;
        doneNP = (!doneN) || (!doneP);
        if(!doneP) posP.x += offNP.x * 2.0;
        if(!doneP) posP.y += offNP.y * 2.0;
        if(doneNP) {
            if(!doneN) lumaEndN = (texture2D(textureSource, (min(posN.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
            if(!doneP) lumaEndP = (texture2D(textureSource, (min(posP.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
            if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
            if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
            doneN = abs(lumaEndN) >= gradientScaled;
            doneP = abs(lumaEndP) >= gradientScaled;
            if(!doneN) posN.x -= offNP.x * 4.0;
            if(!doneN) posN.y -= offNP.y * 4.0;
            doneNP = (!doneN) || (!doneP);
            if(!doneP) posP.x += offNP.x * 4.0;
            if(!doneP) posP.y += offNP.y * 4.0;
            if(doneNP) {
                if(!doneN) lumaEndN = (texture2D(textureSource, (min(posN.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
                if(!doneP) lumaEndP = (texture2D(textureSource, (min(posP.xy, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio)).y;
                if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                doneN = abs(lumaEndN) >= gradientScaled;
                doneP = abs(lumaEndP) >= gradientScaled;
                if(!doneN) posN.x -= offNP.x * 12.0;
                if(!doneN) posN.y -= offNP.y * 12.0;
                doneNP = (!doneN) || (!doneP);
                if(!doneP) posP.x += offNP.x * 12.0;
                if(!doneP) posP.y += offNP.y * 12.0;
            }

        }

    }
    float dstN = posM.x - posN.x;
    float dstP = posP.x - posM.x;
    if(!horzSpan) dstN = posM.y - posN.y;
    if(!horzSpan) dstP = posP.y - posM.y;
    bool goodSpanN = (lumaEndN < 0.0) != lumaMLTZero;
    float spanLength = (dstP + dstN);
    bool goodSpanP = (lumaEndP < 0.0) != lumaMLTZero;
    float spanLengthRcp = 1.0/spanLength;
    bool directionN = dstN < dstP;
    float dst = min(dstN, dstP);
    bool goodSpan = directionN ? goodSpanN : goodSpanP;
    float subpixG = subpixF * subpixF;
    float pixelOffset = (dst * (-spanLengthRcp)) + 0.5;
    float subpixH = subpixG * fxaaQualitySubpix;
    float pixelOffsetGood = goodSpan ? pixelOffset : 0.0;
    float pixelOffsetSubpix = max(pixelOffsetGood, subpixH);
    if(!horzSpan) posM.x += pixelOffsetSubpix * lengthSign;
    if( horzSpan) posM.y += pixelOffsetSubpix * lengthSign;
    // return vec4(0.0, 0.0, 0.0, 1.0);
    return  (texture2D(textureSource, (min(posM, 1.0 - 1e+0 / uTextureInputSize.xy)) * uTextureInputRatio));
}

float ssao() {
    return texture2D(ssaoTexture, vTexCoord).r;
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


void main() {
    uTextureInputSize = resolution;
    uTextureInputRatio = vec2(1.0, 1.0);
    gTexCoord = vTexCoord;
    // gl_FragColor = FxaaPixelShader(
    //     vTexCoord, vec4(0.0), textureSource, textureSource, textureSource, 1.0 / resolution, vec4(0.0), vec4(0.0), vec4(0.0), 0.75, 0.166, 0.0833, 0.0, 0.0, 0.0, vec4(0.0)
    // );
    vec4 color;
    if (enableFXAA == 1.0) {
        color = fxaa();
    } else {
        color = texture2D(textureSource, vTexCoord);
    }
    if (enableSSAO == 1.0) {
        color.rgb = color.rgb * ssao();
        // color = texture2D(ssaoTexture, vTexCoord);
    }
    if (enableToneMapping == 1.0) {
        color.rgb = tonemap(color.rgb);
    }
    // color = texture2D(ssaoTexture, vTexCoord);
    gl_FragColor = color;
}
