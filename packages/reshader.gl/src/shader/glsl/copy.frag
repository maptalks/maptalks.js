precision highp float;

uniform sampler2D texture;
uniform vec2 size;
uniform float enableSharpen;
uniform float sharpFactor;
uniform float pixelRatio;

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

void main() {
    gTexCoord = gl_FragCoord.xy / size;
    vec4 color = texture2D(texture, gTexCoord);
    if (enableSharpen == 1.0) {
    	color.rgb = sharpColorFactor(color.rgb, sharpFactor);
    }
    gl_FragColor = color;
}
