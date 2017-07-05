export default `precision highp float;

attribute vec2 aVertexPosition;
uniform sampler2D positions;
uniform float zoom;

uniform vec2 bounds;

void main(void)
{
  vec4 pos = texture2D(positions, aVertexPosition);
  gl_Position = vec4((pos.xy / bounds * vec2(2.0, -2.0)) + vec2(-1.0, 1.0), 0.0, 1.0);
  gl_PointSize = zoom * 8.0;
}`;
