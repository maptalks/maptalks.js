#ifdef GL_ES
precision highp float;
#endif
uniform vec4 color;

void main() {
  gl_FragColor = color;
}
