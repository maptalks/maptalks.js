export default `    
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

    uniform mat4 projection;
    uniform mat4 view;
    uniform mat4 model;

    void main()
    {
        #if defined(USE_NORMAL_MAP) || defined(USE_ALBEDO_MAP) || defined(USE_OCCULUSIONROUGHNESSMETALLIC_MAP)
            vTexCoord = aTexCoord;
        #endif 
        vWorldPos = vec3(model * vec4(aPosition, 1.0));
        vNormal = mat3(model) * aNormal;

        #ifdef USE_COLOR
            vColor = aColor;
        #endif

        gl_Position =  projection * view * vec4(vWorldPos, 1.0);
    }
`;
