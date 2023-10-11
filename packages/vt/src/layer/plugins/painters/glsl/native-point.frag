#define SHADER_NAME NATIVE_POINT
precision mediump float;
#include <gl2_frag>

#ifdef USE_CIRCLE
    #if __VERSION__ == 100
        #ifdef GL_OES_standard_derivatives
            #define STANDARD_DERIVATIVES_ENABLED 1
            #extension GL_OES_standard_derivatives : enable
        #endif
    #else
        #define STANDARD_DERIVATIVES_ENABLED 1
    #endif
#endif

#ifdef HAS_COLOR
    varying vec4 vColor;
#else
    uniform vec3 markerFill;
#endif

uniform float markerOpacity;
uniform float layerOpacity;

void main() {
    float alpha = 1.0;
    #ifdef USE_CIRCLE
    // https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
        float r = 0.0, delta = 0.0;
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        r = dot(cxy, cxy);
        if (r > 1.0) {
            discard;
        }
        #ifdef STANDARD_DERIVATIVES_ENABLED
            delta = fwidth(r);
            alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
        #endif
    #endif

    #ifdef HAS_COLOR
        vec4 pointColor = vColor;
    #else
        vec4 pointColor = vec4(markerFill, 1.0);
    #endif
    glFragColor = pointColor * markerOpacity * alpha * layerOpacity;

    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
