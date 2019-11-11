//平面图转成cubemap
precision highp float;
#define PI 3.1415926

varying vec3 vWorldPos;

uniform sampler2D equirectangularMap;

const vec2 invAtan = vec2(0.1591, 0.3183);
vec2 SampleSphericalMap(vec3 v)
{
    vec2 uv = vec2(atan(v.y, v.x), asin(v.z));
    uv *= invAtan;
    uv += 0.5;
    return uv;
    // float phi = acos(v.y);
    // // consistent with cubemap.
    // // atan(y, x) is same with atan2 ?
    // float theta = atan(-v.x, v.z) + PI * 0.5;
    // vec2 uv = vec2(theta / 2.0 / PI, phi / PI);
    // return fract(uv);
}

vec4 encodeRGBM(const in vec3 color, const in float range) {
    if(range <= 0.0) return vec4(color, 1.0);
    vec4 rgbm;
    vec3 col = color / range;
    rgbm.a = clamp( max( max( col.r, col.g ), max( col.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = col / rgbm.a;
    return rgbm;
}

void main()
{
    vec2 uv = SampleSphericalMap(normalize(vWorldPos)); // make sure to normalize localPos
    vec3 color = texture2D(equirectangularMap, uv).rgb;

    // gl_FragColor = vec4(color, 1.0);
    #ifdef ENC_RGBM
        gl_FragColor = encodeRGBM(color, 7.0);
    #else
        gl_FragColor = vec4(color, 1.0);
    #endif
    // gl_FragColor = vec4(uv, 0.0, 1.0);
}

