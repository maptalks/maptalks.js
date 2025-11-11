vec3 linearTosRGB(const in vec3 color) {
    return vec3(
        color.r < 0.0031308 ? color.r * 12.92 : 1.055 * pow(color.r, 1.0/2.4) - 0.055,
        color.g < 0.0031308 ? color.g * 12.92 : 1.055 * pow(color.g, 1.0/2.4) - 0.055,
        color.b < 0.0031308 ? color.b * 12.92 : 1.055 * pow(color.b, 1.0/2.4) - 0.055
    );
}
vec3 sRGBToLinear(const in vec3 color) {
    return vec3(
        color.r < 0.04045 ? color.r * (1.0 / 12.92) : pow((color.r + 0.055) * (1.0 / 1.055), 2.4),
        color.g < 0.04045 ? color.g * (1.0 / 12.92) : pow((color.g + 0.055) * (1.0 / 1.055), 2.4),
        color.b < 0.04045 ? color.b * (1.0 / 12.92) : pow((color.b + 0.055) * (1.0 / 1.055), 2.4)
    );
}
