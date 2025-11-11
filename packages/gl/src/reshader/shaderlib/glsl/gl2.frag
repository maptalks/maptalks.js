#if __VERSION__ == 300
    #define varying in
    #define gl_FragDepthEXT gl_FragDepth
    #define texture2D texture
    #define textureCube texture
    #define texture2DProj textureProj
    #define texture2DLodEXT textureLod
    #define texture2DProjLodEXT textureProjLod
    #define textureCubeLodEXT textureLod
    #define texture2DGradEXT textureGrad
    #define texture2DProjGradEXT textureProjGrad
    #define textureCubeGradEXT textureGrad
    out vec4 glFragColor;
#else
    vec4 glFragColor;
#endif
