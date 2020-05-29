#if __VERSION__ == 300
    #define texture2D(tex, uv) texture(tex, uv)
    #define varying out
    #define attribute in
#endif
