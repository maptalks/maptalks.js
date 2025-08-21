#define SHADER_NAME VT_HEIGHT_MASK_FRAG
precision highp float;
#include <gl2_frag>

varying float vAltitude;

#include <common_pack_float>

void main() {
    glFragColor = common_unpackFloat(vAltitude);
    glFragColor = vec4(0.0, 1.0, 0.0, 1.0);
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
