//maptalksgl的material定义
uniform struct Material {
    //https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#reference-pbrmetallicroughness
    #if defined(MATERIAL_HAS_BASECOLOR_MAP)
        sampler2D   baseColorTexture;
    #else
        vec4        baseColorFactor;
    #endif
    #if defined(MATERIAL_HAS_METALLICROUGHNESS_MAP)
        //G: roughness B: metallic
        sampler2D   metallicRoughnessTexture;
    #else
        #if !defined(SHADING_MODEL_CLOTH) && !defined(SHADING_MODEL_SUBSURFACE)
            float       metallicFactor;
        #endif
        float       roughnessFactor;
    #endif

    //https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#occlusiontextureinfo
    #if defined(MATERIAL_HAS_AMBIENT_OCCLUSION)
        #if defined(MATERIAL_HAS_AO_MAP)
            // default: 0.0
            sampler2D occlusionTexture;
        #else
            float occlusion;
        #endif
            float occlusionStrength;
    #endif

    #if defined(MATERIAL_HAS_EMISSIVE)
        #if defined(MATERIAL_HAS_EMISSIVE_MAP)
            sampler2D emissiveTexture;
        #else
            float emissiveFactor;
        #endif
    #endif

    #if defined(MATERIAL_HAS_POST_LIGHTING_COLOR)
        // default: vec4(0.0)
        vec4 postLightingColor;
    #endif

    #if !defined(SHADING_MODEL_CLOTH) && !defined(SHADING_MODEL_SUBSURFACE)
        //TODO reflectance 是否能做成材质？
        // default: 0.5, not available with cloth
            float reflectance;
        #if defined(MATERIAL_HAS_CLEAR_COAT)
                // default: 1.0, 是否是clearCoat, 0 or 1
                float clearCoat;
            #if defined(MATERIAL_HAS_CLEARCOAT_ROUGNESS_MAP)
                sampler2D clearCoatRoughnessTexture;
            #else
                // default: 0.0
                float clearCoatRoughness;
            #endif

            #if defined(MATERIAL_HAS_CLEAR_COAT_NORMAL)
                // default: vec3(0.0, 0.0, 1.0)
                sampler2D clearCoatNormalTexture;
            #endif
        #endif

        #if defined(MATERIAL_HAS_ANISOTROPY)
            // default: 0.0
            float anisotropy;
            // default: vec3(1.0, 0.0, 0.0)
            vec3 anisotropyDirection;
        #endif

    #elif defined(SHADING_MODEL_CLOTH)
        vec3 sheenColor;
        #if defined(MATERIAL_HAS_SUBSURFACE_COLOR)
        vec3 subsurfaceColor;
        #endif
    #else
        float thickness;
        float subsurfacePower;
        vec3 subsurfaceColor;
    #endif

    // not available when the shading model is unlit
    // must be set before calling prepareMaterial()
    #if defined(MATERIAL_HAS_NORMAL)
        // default: vec3(0.0, 0.0, 1.0)
        sampler2D normalTexture;
    #endif
} material;

vec3 gammaCorrectInput(vec3 color) {
    #if defined(GAMMA_CORRECT_INPUT)
        return pow(color, vec3(2.2));
    #else
        return color;
    #endif
}

vec4 gammaCorrectInput(vec4 color) {
    #if defined(GAMMA_CORRECT_INPUT)
        return vec4(gammaCorrectInput(color.rgb), color.a);
    #else
        return color;
    #endif
}

void getMaterial(out MaterialInputs materialInputs) {
    #if defined(MATERIAL_HAS_BASECOLOR_MAP)
        materialInputs.baseColor = gammaCorrectInput(texture2D(material.baseColorTexture, vertex_uv01.xy));
    #else
        materialInputs.baseColor = material.baseColorFactor;
    #endif

    #if defined(MATERIAL_HAS_METALLICROUGHNESS_MAP)
        vec2 roughnessMetallic = texture2D(material.metallicRoughnessTexture, vertex_uv01.xy).gb;
        materialInputs.roughness = roughnessMetallic[0];
        #if !defined(SHADING_MODEL_CLOTH) && !defined(SHADING_MODEL_SUBSURFACE)
            materialInputs.metallic = roughnessMetallic[1];
        #endif
    #else
        materialInputs.roughness = material.roughnessFactor;
        #if !defined(SHADING_MODEL_CLOTH) && !defined(SHADING_MODEL_SUBSURFACE)
            materialInputs.metallic = material.metallicFactor;
        #endif
    #endif

    #if !defined(SHADING_MODEL_CLOTH) && !defined(SHADING_MODEL_SUBSURFACE)
        //TODO 可能需要从纹理中读取
        materialInputs.reflectance = material.reflectance;
    #endif

    #if defined(MATERIAL_HAS_AMBIENT_OCCLUSION)
        #if defined(MATERIAL_HAS_AO_MAP)
            materialInputs.ambientOcclusion = texture2D(material.occlusionTexture, vertex_uv01.xy).r;
        #else
            materialInputs.ambientOcclusion = material.occlusion;
        #endif
        materialInputs.ambientOcclusion *= material.occlusionStrength;
    #endif

    #if defined(MATERIAL_HAS_EMISSIVE)
        #if defined(MATERIAL_HAS_EMISSIVE_MAP)
            materialInputs.emissive = gammaCorrectInput(texture2D(material.emissiveTexture, vertex_uv01.xy));
        #else
            materialInputs.emissive = material.emissiveFactor;
        #endif
    #endif

    #if defined(MATERIAL_HAS_CLEAR_COAT)
        materialInputs.clearCoat = material.clearCoat;
        #if defined(MATERIAL_HAS_CLEARCOAT_ROUGNESS_MAP)
            materialInputs.clearCoatRoughness = texture2D(material.clearCoatRoughnessTexture, vertex_uv01.xy).g;
        #else
            materialInputs.clearCoatRoughness = material.clearCoatRoughness;
        #endif

        #if defined(MATERIAL_HAS_CLEAR_COAT_NORMAL)
            materialInputs.clearCoatNormal = texture2D(material.clearCoatNormalTexture, vertex_uv01.xy).xyz * 2.0 - 1.0;
        #endif
    #endif

    #if defined(MATERIAL_HAS_ANISOTROPY)
        //anisotropy为1时，anisotropicLobe 中 at和ab 结果为1，产生anisotropy不再受roughness影响的现象，绘制结果不符合直觉
        //乘以0.95后，最大值不再为1，则能避免此现象
        materialInputs.anisotropy = material.anisotropy * 0.95;
        materialInputs.anisotropyDirection = material.anisotropyDirection;
    #endif

    #if defined(MATERIAL_HAS_NORMAL)
        materialInputs.normal = texture2D(material.normalTexture, vertex_uv01.xy).xyz * 2.0 - 1.0;
    #endif

    #if defined(MATERIAL_HAS_POST_LIGHTING_COLOR)
        materialInputs.postLightingColor = material.postLightingColor;
    #endif

    #if defined(SHADING_MODEL_CLOTH)
        if (material.sheenColor[0] >= 0.0) {
            materialInputs.sheenColor = material.sheenColor;
        }
        #if defined(MATERIAL_HAS_SUBSURFACE_COLOR)
            materialInputs.subsurfaceColor = material.subsurfaceColor;
        #endif
    #endif

    #if defined(SHADING_MODEL_SUBSURFACE)
        materialInputs.thickness = material.thickness;
        materialInputs.subsurfacePower = material.subsurfacePower;
        materialInputs.subsurfaceColor = material.subsurfaceColor;
    #endif
}
