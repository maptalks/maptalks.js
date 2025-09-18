#define SHADER_NAME VT_HEIGHT_MASK_FRAG
precision highp float;
#include <gl2_frag>

varying float vAltitude;

#include <common_pack_float>

void main() {
    glFragColor = encodeFloat32(vAltitude);
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
