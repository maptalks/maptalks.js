#ifdef GL_ES
precision highp float;
#endif
#include <gl2_frag>

varying vec4 vPosition;

const vec2 range = vec2(-100.0, 1000.0);
vec4 encodeHeight(const in float height) {
    float alpha = 1.0;
    vec4 pack = vec4(0.0);
    pack.a = alpha;
    const vec3 code = vec3(1.0, 255.0, 65025.0);
    pack.rgb = vec3(code * height);
    pack.gb = fract(pack.gb);
    pack.rg -= pack.gb * (1.0 / 256.0);
    pack.b -= mod(pack.b, 4.0 / 255.0);
    return pack;
}

void main() {
    float height = (vPosition.z - range.x) / (range.y - range.x);
    glFragColor = encodeHeight(height);
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
