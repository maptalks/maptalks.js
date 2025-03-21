const vert = /* wgsl */`
const COMMON_FLOAT_MAX: f32 = 1.70141184e38;
const COMMON_FLOAT_MIN: f32 = 1.17549435e-38;

fn common_packFloat(val: vec4f) -> f32 {
    let scl = floor(255.0 * val + 0.5);
    let sgn = select(-1.0, 1.0, scl.a < 128.0);
    let exn = mod(scl.a * 2.0, 256.0) + floor(scl.b / 128.0) - 127.0;
    let man = 1.0 +
        (scl.r / 8388608.0) +
        (scl.g / 32768.0) +
        mod(scl.b, 128.0) / 128.0;
    return sgn * man * pow(2.0, exn);
}

fn common_unpackFloat(v: f32) -> vec4f {
    let av = abs(v);

    // Handle special cases
    if (av < COMMON_FLOAT_MIN) {
        return vec4f(0.0, 0.0, 0.0, 0.0);
    } else if (v > COMMON_FLOAT_MAX) {
        return vec4f(127.0, 128.0, 0.0, 0.0) / 255.0;
    } else if (v < -COMMON_FLOAT_MAX) {
        return vec4f(255.0, 128.0, 0.0, 0.0) / 255.0;
    }

    var c = vec4f(0.0, 0.0, 0.0, 0.0);

    // Compute exponent and mantissa
    let e = floor(log2(av));
    let m = av * pow(2.0, -e) - 1.0;

    // Unpack mantissa
    c[1] = floor(128.0 * m);
    m -= c[1] / 128.0;
    c[2] = floor(32768.0 * m);
    m -= c[2] / 32768.0;
    c[3] = floor(8388608.0 * m);

    // Unpack exponent
    let ebias = e + 127.0;
    c[0] = floor(ebias / 2.0);
    ebias -= c[0] * 2.0;
    c[1] += floor(ebias) * 128.0;

    // Unpack sign bit
    c[0] += 128.0 * step(0.0, -v);

    // Scale back to range
    return c / 255.0;
}

fn common_encodeDepth(depth: f32) -> vec4f {
    let alpha = 1.0;
    var pack = vec4f(0.0);
    pack.a = alpha;
    const code = vec3f(1.0, 255.0, 65025.0);
    pack.rgb = vec3f(code * depth);
    pack.gb = fract(pack.gb);
    pack.rg -= pack.gb * (1.0 / 256.0);
    pack.b -= mod(pack.b, 4.0 / 255.0);
    return pack;
}

fn common_decodeDepth(pack: vec4f) -> f32 {
    return pack.r + pack.g / 255.0;
}
`;

const frag = vert;

export {
    vert, frag
};
