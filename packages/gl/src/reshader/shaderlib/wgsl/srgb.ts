const frag = /*wgsl*/`
fn linearTosRGB(color: vec3f) -> vec3f {
    return vec3f(
        select(1.055 * pow(color.r, 1.0/2.4) - 0.055, color.r * 12.92, color.r < 0.0031308),
        select(1.055 * pow(color.g, 1.0/2.4) - 0.055, color.g * 12.92, color.g < 0.0031308),
        select(1.055 * pow(color.b, 1.0/2.4) - 0.055, color.b * 12.92, color.b < 0.0031308)
    );
}

fn sRGBToLinear(color: vec3f) -> vec3f {
    return vec3f(
        select(pow((color.r + 0.055) * (1.0 / 1.055), 2.4), color.r * (1.0 / 12.92), color.r < 0.04045),
        select(pow((color.g + 0.055) * (1.0 / 1.055), 2.4), color.g * (1.0 / 12.92), color.g < 0.04045),
        select(pow((color.b + 0.055) * (1.0 / 1.055), 2.4), color.b * (1.0 / 12.92), color.b < 0.04045)
    );
}
`;

export default {
    frag
};
