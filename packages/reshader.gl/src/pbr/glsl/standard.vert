    attribute vec3 aPosition;
    attribute vec3 aNormal;

    varying vec3 vWorldPos;
    varying vec3 vNormal;

#if defined(USE_NORMAL_MAP) || defined(USE_ALBEDO_MAP) || defined(USE_OCCULUSIONROUGHNESSMETALLIC_MAP)
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
#endif


#ifdef USE_COLOR
    attribute vec3 aColor;
    varying vec3 vColor;
#endif
#if defined(USE_NORMAL_MAP)
    varying vec3 vViewPos;
    uniform mat4 viewModel;
#endif
    uniform mat4 model;
    uniform mat4 projectionViewModel;

#if defined(USE_SHADOW)
    #include <vsm_shadow_vert>
#endif

    void main()
    {
        #if defined(USE_NORMAL_MAP) || defined(USE_ALBEDO_MAP) || defined(USE_OCCULUSIONROUGHNESSMETALLIC_MAP)
            vTexCoord = aTexCoord;
        #endif
        vec4 pos = vec4(aPosition, 1.0);
        vec4 worldPos = model * pos;
        vWorldPos = worldPos.xyz;

        #if defined(USE_NORMAL_MAP)
            vViewPos = (viewModel * pos).xyz;
        #endif

        vNormal = mat3(model) * aNormal;

        #ifdef USE_COLOR
            vColor = aColor;
        #endif
        gl_Position =  projectionViewModel * vec4(aPosition, 1.0);

        #ifdef USE_SHADOW
            vsm_shadow_computeShadowPars(worldPos);
        #endif
    }

