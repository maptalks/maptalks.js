const frag = /*wgsl*/`
fn encodeRGBM(color: vec3f, range: f32) -> vec4f {
    if range <= 0.0 {
        return vec4f(color, 1.0);
    }
    var rgbm: vec4f;
    let col = color / range;
    rgbm.a = clamp(max(max(col.r, col.g), max(col.b, 1e-6)), 0.0, 1.0);
    rgbm.a = ceil(rgbm.a * 255.0) / 255.0;
    rgbm = vec4f(col / rgbm.a, rgbm.a);
    return rgbm;
}

fn decodeRGBM(color: vec4f, range: f32) -> vec3f {
    if range <= 0.0 {
        return color.rgb;
    }
    return range * color.rgb * color.a;
}
`;

export default {
    frag
};
