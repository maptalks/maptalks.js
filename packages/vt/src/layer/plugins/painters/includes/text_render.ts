const frag = /*wgsl*/`
#define SDF_PX 8.0
#define DEVICE_PIXEL_RATIO 1.0
// 0.105 / DEVICE_PIXEL_RATIO
#define EDGE_GAMMA 0.105 / 1.0

struct TextRenderShaderUniforms {
    gammaScale: f32
}

struct TextRenderUniforms {
    textOpacity: f32,
    isHalo: f32,
    textHaloBlur: f32,
    #ifndef HAS_TEXT_HALO_OPACITY
        textHaloOpacity: f32,
    #endif
    #ifndef HAS_TEXT_HALO_RADIUS
        textHaloRadius: f32,
    #endif
    #ifndef HAS_TEXT_FILL
        textFill: vec4f,
    #endif
    #ifndef HAS_TEXT_HALO_FILL
        textHaloFill: vec4f,
    #endif
};

@group(0) @binding($b) var<uniform> textRenderUniforms: TextRenderUniforms;
@group(0) @binding($b) var<uniform> textRenderShaderUniforms: TextRenderShaderUniforms;
@group(0) @binding($b) var glyphTex: texture_2d<f32>;
@group(0) @binding($b) var glyphTexSampler: sampler;


fn renderText(input: VertexOutput) -> vec4f {
    #ifdef HAS_TEXT_FILL
        var myTextFill = input.vTextFill;
    #else
        var myTextFill = textRenderUniforms.textFill;
    #endif
    let gammaScale = textRenderShaderUniforms.gammaScale;
    let fontScale = input.vTextSize / 24.0;
    var color = myTextFill;
    var gamma = EDGE_GAMMA / (fontScale * gammaScale);
    var buff = 185.0 / 256.0; // (256.0 - 64.0) / 256.0

    var isHaloText: bool;
    #ifdef HAS_HALO_ATTR
        // text halo in icon
        isHaloText = input.vHalo > 0.5;
    #else
        isHaloText = textRenderUniforms.isHalo == 1.0;
    #endif

    if (isHaloText) {
        #ifdef HAS_TEXT_HALO_FILL
            var haloFill = input.vTextHaloFill;
        #else
            var haloFill = textRenderUniforms.textHaloFill;
        #endif

        #ifdef HAS_TEXT_HALO_RADIUS
            let haloRadius = input.vTextHalo.x;
        #else
            let haloRadius = textRenderUniforms.textHaloRadius;
        #endif

        if (haloRadius == 0.0) {
            discard;
        }

        color = haloFill;
        gamma = (textRenderUniforms.textHaloBlur * 1.19 / SDF_PX + EDGE_GAMMA) / (fontScale * gammaScale);
        buff = (6.0 - haloRadius / fontScale) / SDF_PX;

        #ifdef HAS_TEXT_HALO_OPACITY
            let haloOpacity = input.vTextHalo.y / 255.0;
        #else
            let haloOpacity = textRenderUniforms.textHaloOpacity;
        #endif

        color *= haloOpacity * 1.25;
    }

    let dist = textureSampleLevel(glyphTex, glyphTexSampler, input.vTexCoord, 0.0).r;
    let gammaScaled = gamma * input.vGammaScale * 0.7;

    let alpha = clamp(smoothstep(buff - gammaScaled, buff + gammaScaled, dist), 0.0, 1.0);
    return color * (alpha * textRenderUniforms.textOpacity);
}
`;

export default {
    frag
};
