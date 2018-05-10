precision mediump float;

uniform vec3 color;
uniform float opacity;

#include <vsm_shadow_frag>

void main() {
    float shadow = 0.0;
    for (int i = 0; i < NUM_OF_DIR_LIGHTS; i++) {
        shadow += shadow_computeShadow(i);
    }
    float alpha = (1.0 - shadow);
	gl_FragColor = vec4(color * alpha, opacity * alpha);
}
