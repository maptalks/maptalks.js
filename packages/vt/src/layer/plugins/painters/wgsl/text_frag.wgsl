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
