#define SHADER_NAME SSR_COMBINE
precision mediump float;

uniform sampler2D TextureInput;
uniform sampler2D TextureSSR;
uniform vec2 uTextureOutputSize;

void main() {
    vec2 uv = gl_FragCoord.xy / uTextureOutputSize;
    vec4 source = texture2D(TextureInput, uv);
    vec4 ssrColor = texture2D(TextureSSR, uv);
    gl_FragColor = mix(source, ssrColor, ssrColor.a);
}
