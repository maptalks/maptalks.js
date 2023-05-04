#define SHADER_NAME TERRAIN_MESH

precision mediump float;
uniform sampler2D skin;
uniform float opacity;
uniform vec4 debugColor;
varying vec2 vUv;

void main() {
    vec2 uv = vec2(vUv);
    uv.y = 1.0 - uv.y;
    vec4 color = texture2D(skin, uv);
    gl_FragColor = color * opacity;
    gl_FragColor *= debugColor;
}
