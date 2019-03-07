precision mediump float;

uniform float lineOpacity;
uniform vec4 lineColor;

void main()
{
    gl_FragColor = lineColor * lineOpacity;
}
