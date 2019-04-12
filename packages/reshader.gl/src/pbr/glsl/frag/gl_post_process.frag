float linearToSRGB(float c) {
    return (c <= 0.0031308) ? c * 12.92 : (pow(abs(c), 1.0 / 2.4) * 1.055) - 0.055;
}
vec3 linearToSRGB(vec3 c) {
    return vec3(linearToSRGB(c.r), linearToSRGB(c.g), linearToSRGB(c.b));
}

vec3 HDR_ACES(const vec3 x) {
    // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}
vec3 tonemap(const vec3 x) {
    return HDR_ACES(x);
}

vec3 postProcess(vec3 color) {
    vec3 c = color;
    c = linearToSRGB(tonemap(c));
    return c;
}
