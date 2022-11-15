#ifdef GL_ES
precision highp float;
#endif
#include <gl2_frag>

uniform float logDepthBufFC;
varying float vFragDepth;
varying vec2 vHighPrecisionZW;
/**
* 分解保存深度值,避免精度损失
*/
const float PackUpscale = 256. / 255.;
const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA(const in float v ) {
    vec4 r = vec4(fract(v * PackFactors), v);
    r.yzw -= r.xyz * ShiftRight8;
    return r * PackUpscale;
}
void main() {
    gl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;
    float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
    glFragColor = packDepthToRGBA(fragCoordZ);
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
