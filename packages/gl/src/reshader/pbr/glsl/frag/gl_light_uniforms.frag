#if defined(HAS_IBL_LIGHTING)
    //dfgMap
    uniform sampler2D light_iblDFG;
    //prefilterMap
    uniform samplerCube light_iblSpecular;
#else
    uniform vec3 light_ambientColor;
    //shading_lit中需要的方法
    vec3 prefilteredDFG(float perceptualRoughness, float NoV) {
        return vec3(0.0);
    }
    void evaluateIBL(const MaterialInputs material, const PixelParams pixel, inout vec3 color) {
        color += light_ambientColor * frameUniforms.iblLuminance;
    }
#endif
