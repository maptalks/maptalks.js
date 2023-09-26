#define SHADER_NAME NATIVE_LINE
precision mediump float;

uniform float lineOpacity;
uniform vec4 lineColor;
uniform float layerOpacity;

#if defined(HAS_COLOR)
    varying vec4 vColor;
#endif

void main()
{
    gl_FragColor = lineColor * lineOpacity;
    #if defined(HAS_COLOR)
        gl_FragColor *= vColor;
    #endif
    gl_FragColor *= layerOpacity;
}
