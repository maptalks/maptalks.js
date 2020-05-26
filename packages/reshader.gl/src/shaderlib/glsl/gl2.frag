#if __VERSION__ == 300
    #define texture2D(tex, uv) texture(tex, uv)
    #define varying in
    out vec4 glFragColor;
#else
    vec4 glFragColor;
#endif
