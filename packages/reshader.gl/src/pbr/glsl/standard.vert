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
    uniform mat4 viewModelMatrix;
#endif
    uniform mat4 modelMatrix;
    uniform mat4 projViewModelMatrix;

#ifdef USE_SHADOW_MAP
    #include <vsm_shadow_vert>
#endif

    void main()
    {
        #if defined(USE_NORMAL_MAP) || defined(USE_ALBEDO_MAP) || defined(USE_OCCULUSIONROUGHNESSMETALLIC_MAP)
            vTexCoord = aTexCoord;
        #endif
        vec4 pos = vec4(aPosition, 1.0);
        vWorldPos = (modelMatrix * pos).xyz;

        #if defined(USE_NORMAL_MAP)
            vViewPos = (viewModelMatrix * pos).xyz;
        #endif

        vNormal = mat3(modelMatrix) * aNormal;

        #ifdef USE_COLOR
            vColor = aColor / 255.0;
        #endif
        gl_Position =  projViewModelMatrix * pos;

        #ifdef USE_SHADOW_MAP
            shadow_computeShadowPars(pos);
        #endif
    }

