#define SHADER_NAME MARKER

precision mediump float;

uniform sampler2D texture;
uniform lowp float markerOpacity;
uniform lowp float blendSrcIsOne;

varying vec2 vTexCoord;
varying float vOpacity;

void main() {
    gl_FragColor = texture2D(texture, vTexCoord) * markerOpacity * vOpacity;
    if (blendSrcIsOne == 1.0) {
    	gl_FragColor *= gl_FragColor.a;
    }
}
