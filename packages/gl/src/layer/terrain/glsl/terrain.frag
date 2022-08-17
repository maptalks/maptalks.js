precision mediump float;
uniform sampler2D skins[SKIN_COUNT];
varying vec2 vUv;

vec4 blend(vec4 src, vec4 dst) {
    return vec4(src.rgb * src.a + dst.rgb * (1.0 - src.a), src.a + (1.0 - src.a) * dst.a);
}

void main() {
    vec4 color = vec4(1.0);
    for (int i = 0; i < SKIN_COUNT; i++) {
        color *= blend(texture2D(tex[i],vUv), color);
    }
    gl_FragColor = color;
}
