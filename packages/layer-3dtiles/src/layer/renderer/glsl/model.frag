precision mediump float;

#ifdef USE_BASECOLOR_TEXTURE
    uniform sampler2D baseColor;
#else
    uniform vec4 baseColor;
#endif
uniform vec3 ambientLight;
uniform bool debug;
uniform float linearColor;

#ifdef HAS_TEX
    varying vec2 vTexCoord;
#endif
#ifdef USE_MAX_EXTENT
    uniform vec4 maxExtent;
    varying vec2 vXy;
#endif

vec3 sRGBToLinear(const in vec3 color) {
    return vec3( color.r < 0.04045 ? color.r * (1.0 / 12.92) : pow((color.r + 0.055) * (1.0 / 1.055), 2.4), color.g < 0.04045 ? color.g * (1.0 / 12.92) : pow((color.g + 0.055) * (1.0 / 1.055), 2.4), color.b < 0.04045 ? color.b * (1.0 / 12.92) : pow((color.b + 0.055) * (1.0 / 1.055), 2.4));
}

void main() {
    #ifdef USE_MAX_EXTENT
        if (vXy.x < maxExtent.x || vXy.x > maxExtent.z || vXy.y < maxExtent.y || vXy.y > maxExtent.w) {
            discard;
            return;
        }
    #endif
    if (debug) {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    } else {
        #if defined(USE_BASECOLOR_TEXTURE) && defined(HAS_TEX)
            vec4 fetchColor = texture2D(baseColor, vTexCoord);
            gl_FragColor = vec4((fetchColor.rgb + ambientLight) * fetchColor.a, fetchColor.a);
        #else
            gl_FragColor = baseColor;
            gl_FragColor.rgb += ambientLight;
        #endif
    }
    if (linearColor == 1.0) {
        gl_FragColor = vec4(sRGBToLinear(gl_FragColor.rgb), gl_FragColor.a);
    }
}
