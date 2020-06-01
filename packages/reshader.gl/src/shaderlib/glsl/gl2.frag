#if __VERSION__ == 300
    #define texture2D(tex, uv) texture(tex, uv)
    #define saturate(x)        clamp(x, 0.0, 1.0)
    #define varying in
    out vec4 glFragColor;
#else
    vec4 glFragColor;
#endif
