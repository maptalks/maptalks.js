#ifdef GL_ES
precision highp float;
#endif
varying float flood_height;
uniform float flood_waterHeight;
// uniform vec3 flood_waterColor;
void main() {
    if (flood_height < flood_waterHeight) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(0.0);
    }
}
