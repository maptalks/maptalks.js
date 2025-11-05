struct TextFragUniforms {
    layerOpacity: f32,

}

struct TextUniforms {
    alphaTest: f32
}

@group(0) @binding($b) var<uniform> uniforms: TextFragUniforms;
@group(0) @binding($b) var<uniform> textUniforms: TextUniforms;

#include <text_render_frag>
#include <highlight_frag>

struct VertexOutput {
    @location($o) vTexCoord: vec2f,
    @location($o) vGammaScale: f32,
    @location($o) vTextSize: f32,
    @location($o) vOpacity: f32,
    #ifdef HAS_TEXT_FILL
        @location($o) vTextFill: vec4f,
    #endif
    #ifdef HAS_TEXT_HALO_FILL
        @location($o) vTextHaloFill: vec4f,
    #endif
    #if HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY
        @location($o) vTextHalo: vec2f,
    #endif
};

@fragment
fn main(input: VertexOutput) -> @location(0) vec4f {
    var fragColor = renderText(input) * input.vOpacity * uniforms.layerOpacity;

    if (fragColor.a < textUniforms.alphaTest) {
        discard;
    }

    #if HAS_HIGHLIGHT_OPACITY || HAS_HIGHLIGHT_COLOR
        return highlight_blendColor(fragColor, input);
    #else
        return fragColor;
    #endif
}
