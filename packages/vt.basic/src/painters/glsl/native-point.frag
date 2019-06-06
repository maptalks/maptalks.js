#ifdef USE_CIRCLE
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
#endif

precision mediump float;

uniform vec3 markerFill;
uniform float markerOpacity;

void main() {
    float alpha = 1.0;
    #ifdef USE_CIRCLE
    // https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
        float r = 0.0, delta = 0.0;
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        r = dot(cxy, cxy);
        #ifdef GL_OES_standard_derivatives
            delta = fwidth(r);
            alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
        #endif
    #endif

    gl_FragColor = vec4(markerFill, 1.0) * markerOpacity * alpha;
}
