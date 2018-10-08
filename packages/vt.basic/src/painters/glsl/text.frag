#define DEVICE_PIXEL_RATIO 1.0
#define EDGE_GAMMA 0.105 / DEVICE_PIXEL_RATIO

precision mediump float;

uniform sampler2D texture;
uniform vec4 textFill;
uniform highp float gammaScale;

varying vec2 vTexCoord;
varying float vSize;
varying float vGammaScale;

void main() {
    bool isText = true;
    float size = vSize;

    float fontScale = isText ? size / 24.0 : size;

    float dist = texture2D(texture, vTexCoord).a;
    highp float gamma = EDGE_GAMMA / (fontScale * gammaScale);
    lowp float buff = 192.0 / 256.0;//(256.0 - 64.0) / 256.0;
    //TODO halo
    highp float gammaScaled = gamma * vGammaScale; // 0.5 is a magic number, don't ask me

    float alpha = smoothstep(buff - gammaScaled, buff + gammaScaled, dist);
    gl_FragColor = vec4(textFill.rgb, alpha * textFill.a);
    //TODO gamma 的值有些过大

}

// if (u_is_halo) {
//     color = halo_color;
//     gamma = (halo_blur * 1.19 / SDF_PX + EDGE_GAMMA) / (fontScale * uGamma_scale);
//     buff = (6.0 - halo_width / fontScale) / SDF_PX;
// }
