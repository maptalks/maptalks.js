#version 100
precision mediump float;

uniform sampler2D TextureInput;
uniform vec2 outputSize;
#define SHADER_NAME QUAD

vec2 gTexCoord;
void main(void) {
    gTexCoord = gl_FragCoord.xy / outputSize.xy;
    vec4 color = texture2D(TextureInput, gTexCoord.xy);
    gl_FragColor = color;
}
