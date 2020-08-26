#define SHADER_NAME SHADOW_DISPLAY

precision mediump float;

uniform vec3 color;

#include <vsm_shadow_frag>

void main() {
    float visibility = shadow_computeShadow();
    float alpha = 1.0 - visibility;
    gl_FragColor = vec4(color * alpha, alpha);
}
