#define SHADER_NAME CUBEMAP
precision highp float;

uniform samplerCube cubeMap;
uniform float exposure;
varying vec3 vWorldPos;

#ifdef ENCODE_RGBM
vec4 encodeRGBM(const in vec3 color, const in float range) {
    if(range <= 0.0) return vec4(color, 1.0);
    vec4 rgbm;
    vec3 col = color / range;
    rgbm.a = clamp( max( max( col.r, col.g ), max( col.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = col / rgbm.a;
    return rgbm;
}
#endif


void main()
{
    vec4 glFragColor = textureCube(cubeMap, vWorldPos);
    glFragColor.rgb *= exposure;
    #ifdef ENCODE_RGBM
        glFragColor = encodeRGBM(glFragColor.rgb, 7.0);
    #endif
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif

}
