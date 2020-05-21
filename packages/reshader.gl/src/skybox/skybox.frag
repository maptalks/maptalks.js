#ifdef GL_EXT_shader_texture_lod
    #extension GL_EXT_shader_texture_lod : enable
    #define textureCubeLod(tex, uv, lod) textureCubeLodEXT(tex, uv, lod)
#else
    #define textureCubeLod(tex, uv, lod) textureCube(tex, uv, lod)
#endif
#extension GL_OES_standard_derivatives : enable
precision highp float;

varying vec3 vWorldPos;

uniform samplerCube cubeMap;

#ifdef USE_MIPMAP
    uniform float bias;
    uniform float uSize;
    uniform float uEnvironmentExposure;
    uniform float uBackgroundExposure;
#endif

#ifdef USE_AMBIENT
    uniform vec3 uDiffuseSPH[9];
#endif

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

vec4 textureCubeFixed(const in samplerCube tex, const in vec3 R, const in float size, const in float bias) {
    vec3 dir = R;
    float scale = 1.0 - 1.0 / size;
    vec3 absDir = abs(dir);
    float M = max(max(absDir.x, absDir.y), absDir.z);
    if (absDir.x != M) dir.x *= scale;
    if (absDir.y != M) dir.y *= scale;
    if (absDir.z != M) dir.z *= scale;
    return textureCubeLod(tex, dir, bias);
}

vec3 computeDiffuseSPH(const in vec3 normal, const in vec3 uDiffuseSPH[9]) {
    float x = normal.x;
    float y = normal.y;
    float z = normal.z;
    vec3 result = (
        uDiffuseSPH[0] +

        uDiffuseSPH[1] * x +
        uDiffuseSPH[2] * y +
        uDiffuseSPH[3] * z +

        uDiffuseSPH[4] * z * x +
        uDiffuseSPH[5] * y * z +
        uDiffuseSPH[6] * y * x +
        uDiffuseSPH[7] * (3.0 * z * z - 1.0) +
        uDiffuseSPH[8] * (x*x - y*y)
        );
    return max(result, vec3(0.0));
}

float pseudoRandom(const in vec2 fragCoord) {
    vec3 p3 = fract(vec3(fragCoord.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

void main()
{
    vec4 envColor;
    #ifdef USE_AMBIENT
        vec3 normal = normalize(vWorldPos + mix(-0.5/255.0, 0.5/255.0, pseudoRandom(gl_FragCoord.xy))*2.0);
        envColor = vec4(computeDiffuseSPH(normal, uDiffuseSPH), 1.0);
    #elif defined(USE_MIPMAP)
        envColor = textureCubeFixed(cubeMap, vWorldPos, uSize, bias);
        envColor.rgb *= uEnvironmentExposure * uBackgroundExposure;
    #else
        envColor = textureCube(cubeMap, vWorldPos);
    #endif
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
