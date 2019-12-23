precision highp float;
precision highp int;
#define SHADER_NAME ShaderMaterial
varying vec2 vTexCoord;
uniform sampler2D maskTexture;
uniform sampler2D edgeTexture1;
uniform sampler2D edgeTexture2;
uniform float edgeStrength;
uniform float edgeGlow;
void main() {
    vec4 edgeValue1 = texture2D(edgeTexture1, vTexCoord);
    vec4 edgeValue2 = texture2D(edgeTexture2, vTexCoord);
    vec4 maskColor = texture2D(maskTexture, vTexCoord);
    vec4 edgeValue = edgeValue1 + edgeValue2 * edgeGlow;
    vec4 finalColor = edgeStrength * maskColor.r * edgeValue;
    gl_FragColor = finalColor;
}