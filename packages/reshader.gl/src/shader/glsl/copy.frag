#define FXAA_REDUCE_MIN   (1.0/ 128.0)
#define FXAA_REDUCE_MUL   (1.0 / 8.0)
#define FXAA_SPAN_MAX     8.0

precision highp float;

uniform sampler2D texture;
uniform vec2 size;
uniform float enableSharpen;
uniform float sharpFactor;
uniform float pixelRatio;
uniform float enableAA;

vec2 gTexCoord;

vec3 sharpColorFactor(const in vec3 color, const float sharp) {
    vec2 off = pixelRatio / size.xy;
    float count = 0.0;
    vec4 rgbNW = texture2D(texture, gTexCoord + off * vec2(-1.0, -1.0));
    rgbNW.rgb = mix(vec3(0.0), rgbNW.rgb, sign(rgbNW.a));
    count += mix(0.0, 1.0, sign(rgbNW.a));
    vec4 rgbSE = texture2D(texture, gTexCoord + off * vec2(1.0, 1.0));
    rgbSE.rgb = mix(vec3(0.0), rgbSE.rgb, sign(rgbSE.a));
    count += mix(0.0, 1.0, sign(rgbSE.a));
    vec4 rgbNE = texture2D(texture, gTexCoord + off * vec2(1.0, -1.0));
    rgbNE.rgb = mix(vec3(0.0), rgbNE.rgb, sign(rgbNE.a));
    count += mix(0.0, 1.0, sign(rgbNE.a));
    vec4 rgbSW = texture2D(texture, gTexCoord + off * vec2(-1.0, 1.0));
    rgbSW.rgb = mix(vec3(0.0), rgbSW.rgb, sign(rgbSW.a));
    count += mix(0.0, 1.0, sign(rgbSW.a));
    return color + sharp * (count * color - rgbNW.rgb - rgbNE.rgb - rgbSW.rgb - rgbSE.rgb);
}

vec4 applyFXAA(sampler2D tex, vec2 fragCoord) {
    vec4 color;
    mediump vec2 inverseVP = vec2(1.0 / size.x, 1.0 / size.y);
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

void main() {
    gTexCoord = gl_FragCoord.xy / size;
    vec4 color;
    if (enableAA == 1.0) {
        color = applyFXAA(texture, gl_FragCoord.xy);
    } else {
        color = texture2D(texture, gTexCoord);
    };
    if (enableSharpen == 1.0) {
    	color.rgb = sharpColorFactor(color.rgb, sharpFactor);
    }
    gl_FragColor = color;
}
