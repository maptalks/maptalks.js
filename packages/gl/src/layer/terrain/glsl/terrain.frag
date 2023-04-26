#define SHADER_NAME TERRAIN_MESH

precision mediump float;
uniform sampler2D skin;
uniform float opacity;
uniform vec4 debugColor;
uniform float isParent;
varying vec2 vUv;

void main() {
    vec2 uv = vec2(vUv);
    uv.y = 1.0 - uv.y;
    vec4 color = texture2D(skin, uv);
    gl_FragColor = color * opacity;
    if (isParent == 1.0) {
        gl_FragColor *= debugColor;
    }
}
