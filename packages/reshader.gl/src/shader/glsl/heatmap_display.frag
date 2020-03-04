#define SHADER_NAME HEATMAP_DISPLAY
precision mediump float;

uniform sampler2D inputTexture;
uniform sampler2D colorRamp;
uniform vec2 textureOutputSize;
uniform float heatmapOpacity;

void main() {
    vec2 gTexCoord = gl_FragCoord.xy / textureOutputSize.xy;
    float t = texture2D(inputTexture, gTexCoord).r;
    vec4 color = texture2D(colorRamp, vec2(t, 0.5));
    gl_FragColor = color * heatmapOpacity;
}
