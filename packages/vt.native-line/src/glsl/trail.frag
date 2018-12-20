#ifdef GL_ES
    precision lowp float;
#endif

uniform float lineOpacity;
uniform vec4 lineColor;

varying float vTime;

void main()
{
    if (vTime > 1.0 || vTime < 0.0) {
        discard;
    }
    gl_FragColor = lineColor * lineOpacity * vTime;
}
