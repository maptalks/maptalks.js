const frag = /*wgsl*/`
const HSV_K0 = vec4f(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
const HSV_K1 = vec4f(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
const HSV_E = 1.0e-10;

fn hsv_rgb2hsv(c: vec3f) -> vec3f {
    var K = HSV_K0;
    var p = mix(vec4f(c.bg, K.wz), vec4f(c.gb, K.xy), select(0.0, 1.0, c.b <= c.g));
    var q = mix(vec4f(p.xyw, c.r), vec4f(c.r, p.yzx), select(0.0, 1.0, p.x <= c.r));

    // Alternative implementation commented out
    // var p = select(vec4f(c.gb, K.xy), vec4f(c.bg, K.wz), c.g < c.b);
    // var q = select(vec4f(c.r, p.yzx), vec4f(p.xyw, c.r), c.r < p.x);

    let d = q.x - min(q.w, q.y);
    let e = HSV_E;
    return vec3f(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

fn hsv_hsv2rgb(c: vec3f) -> vec3f {
    let K = HSV_K1;
    let p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, vec3f(0.0), vec3f(1.0)), c.y);
}

fn hsv_apply4(c: vec4f, hsvOffset: vec3f) -> vec4f {
    var hsv = hsv_rgb2hsv(c.rgb);
    hsv += hsv * hsvOffset;
    hsv = clamp(hsv, vec3f(0), vec3f(1));
    return vec4f(hsv_hsv2rgb(hsv), c.a);
}

fn hsv_apply3(c: vec3f, hsvOffset: vec3f) -> vec3f {
    var hsv = hsv_rgb2hsv(c);
    hsv += hsv * hsvOffset;
    hsv = clamp(hsv, vec3f(0), vec3f(1));
    return hsv_hsv2rgb(hsv);
}

fn contrastMatrix(contrast: f32) -> mat4x4f {
    let t = (1.0 - contrast) / 2.0;
    return mat4x4f(
        vec4f(contrast, 0.0, 0.0, 0.0),
        vec4f(0.0, contrast, 0.0, 0.0),
        vec4f(0.0, 0.0, contrast, 0.0),
        vec4f(t, t, t, 1.0)
    );
}
`;

export default {
    frag
};
