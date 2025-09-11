//http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl

const mediump vec4 HSV_K0 = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
const mediump vec4 HSV_K1 = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
const mediump float HSV_E = 1.0e-10;

vec3 hsv_rgb2hsv(vec3 c) {
    vec4 K = HSV_K0;
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    // 另一种据说性能更好的实现方式
    // vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    // vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);

    float d = q.x - min(q.w, q.y);
    float e = HSV_E;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv_hsv2rgb(vec3 c) {
    vec4 K = HSV_K1;
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 hsv_apply(vec4 c, vec3 hsvOffset) {
    vec3 hsv = hsv_rgb2hsv(c.rgb);
    hsv += hsv * hsvOffset;
    hsv = clamp(hsv, 0.0, 1.0);
    return vec4(hsv_hsv2rgb(hsv), c.a);
}

vec3 hsv_apply(vec3 c, vec3 hsvOffset) {
    vec3 hsv = hsv_rgb2hsv(c.rgb);
    hsv += hsv * hsvOffset;
    hsv = clamp(hsv, 0.0, 1.0);
    return hsv_hsv2rgb(hsv);
}

mat4 contrastMatrix(float contrast)
{
    float t = (1.0 - contrast) / 2.0;
    return mat4(
        contrast, 0., 0., 0.,
        0., contrast, 0., 0.,
        0., 0., contrast, 0.,
        t, t, t, 1
    );
}
