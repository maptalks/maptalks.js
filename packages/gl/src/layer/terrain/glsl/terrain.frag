#define SHADER_NAME TERRAIN_SKIN

precision mediump float;
uniform sampler2D skins[SKIN_COUNT];
uniform float opacity;
uniform vec4 debugColor;
uniform float isParent;
varying vec2 vUv;

vec4 blend(vec4 src, vec4 dst) {
    return vec4(src.rgb * src.a + dst.rgb * (1.0 - src.a), src.a + (1.0 - src.a) * dst.a);
}

void main() {
    vec2 uv = vec2(vUv);
    uv.y = 1.0 - uv.y;
    vec4 color = vec4(0.0);
    for (int i = 0; i < SKIN_COUNT; i++) {
        color = blend(texture2D(skins[i], uv), color);
    }
    gl_FragColor = color * opacity;
    if (isParent == 1.0) {
        gl_FragColor *= debugColor;
    }
}
