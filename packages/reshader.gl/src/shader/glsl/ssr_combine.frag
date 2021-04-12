// 2021-02-05
// ssr逻辑修改后不再需要
#define SHADER_NAME SSR_COMBINE
precision mediump float;

uniform sampler2D TextureInput;
uniform sampler2D TextureSSR;
uniform vec2 outputSize;

void main() {
    vec2 uv = gl_FragCoord.xy / outputSize;
    vec4 source = texture2D(TextureInput, uv);
    vec4 ssrColor = texture2D(TextureSSR, uv);
    gl_FragColor = mix(source, ssrColor, ssrColor.a);
}
