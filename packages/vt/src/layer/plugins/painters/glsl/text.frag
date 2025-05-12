#define SHADER_NAME TEXT_FRAG

precision mediump float;

uniform float layerOpacity;
varying vec2 vTexCoord;
varying float vOpacity;
uniform float alphaTest;

#include <text_render_frag>

#include <highlight_frag>

void main() {
    gl_FragColor = renderText(vTexCoord) * vOpacity * layerOpacity;
    if (gl_FragColor.a < alphaTest) {
        discard;
    }
    gl_FragColor = highlight_blendColor(gl_FragColor);
}
