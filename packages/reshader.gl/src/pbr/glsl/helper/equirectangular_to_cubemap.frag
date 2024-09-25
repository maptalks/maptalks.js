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

void main()
{
    vec2 uv = SampleSphericalMap(normalize(vWorldPos)); // make sure to normalize localPos
    vec4 color = texture2D(equirectangularMap, uv);

    gl_FragColor = vec4(color.rgb, 1.0);
}

