precision mediump float;
varying vec2 vTexCoord;

uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D rainMap;
void main() {
    vec4 rainColor = texture2D(rainMap, vTexCoord);
    vec4 diffuseColor = vec4(diffuse, opacity);
    diffuseColor *= rainColor;
    gl_FragColor = diffuseColor;
}
