precision highp float;

varying vec3 vWorldPos;

uniform samplerCube cubeMap;

vec4 encodeRGBM(const in vec3 color, const in float range) {
    if(range <= 0.0) return vec4(color, 1.0);
    vec4 rgbm;
    vec3 col = color / range;
    rgbm.a = clamp( max( max( col.r, col.g ), max( col.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = col / rgbm.a;
    return rgbm;
}

vec3 decodeRGBM(const in vec4 color, const in float range) {
    if(range <= 0.0) return color.rgb;
    return range * color.rgb * color.a;
}

void main()
{
    vec4 envColor = textureCube(cubeMap, vWorldPos);

    #ifdef ENC_RGBM
    	gl_FragColor = encodeRGBM(envColor.rgb, 7.0);
    #elif defined(DEC_RGBM)
    	gl_FragColor = vec4(decodeRGBM(envColor, 7.0), 1.0);
    #else
    	gl_FragColor = envColor;
    #endif

    #ifdef USE_HDR
	    vec3 color = gl_FragColor.rgb;
	    color = color / (color.rgb + vec3(1.0));
	    color = pow(color, vec3(1.0/2.2));
	    gl_FragColor.rgb = color;
    #endif
}
