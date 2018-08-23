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

#ifdef USE_SHADOW_MAP
    #include <vsm_shadow_vert>
#endif

#ifdef ENABLE_PICKING
    #include <fbo_picking_vert>
#endif

    void main()
    {
        #if defined(USE_NORMAL_MAP) || defined(USE_ALBEDO_MAP) || defined(USE_OCCULUSIONROUGHNESSMETALLIC_MAP)
            vTexCoord = aTexCoord;
        #endif
        vec4 pos = vec4(aPosition, 1.0);
        vWorldPos = (model * pos).xyz;

        #if defined(USE_NORMAL_MAP)
            vViewPos = (viewModel * pos).xyz;
        #endif

        vNormal = mat3(model) * aNormal;

        #ifdef USE_COLOR
            vColor = aColor;
        #endif
        gl_Position =  projectionViewModel * pos;

        #ifdef USE_SHADOW_MAP
            shadow_computeShadowPars(pos);
        #endif
        #ifdef ENABLE_PICKING
            fbo_picking_setData(gl_Position.w);
        #endif
    }

