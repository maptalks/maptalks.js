#ifdef GL_ES
    precision lowp float;
#endif

uniform float lineOpacity;
uniform vec4 lineColor;

void main()
{
    gl_FragColor = lineColor * lineOpacity;
}
