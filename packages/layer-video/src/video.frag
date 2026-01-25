precision mediump float;
uniform sampler2D videoTexture;
uniform float opacity;

varying vec2 vTexCoords;
void main() {
    vec4 color = texture2D(videoTexture, vTexCoords);
    gl_FragColor = color * opacity;
}
