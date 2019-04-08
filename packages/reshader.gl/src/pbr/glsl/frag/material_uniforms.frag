//maptalksgl的material定义
uniform struct Material {
    //https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#reference-pbrmetallicroughness
    #if defined(MATERIAL_HAS_BASECOLOR_MAP)
        sampler2D   baseColorTexture;
    #else
        vec4        baseColorFactor;
    #endif
    #if defined(MATERIAL_HAS_METALLICROUGHNESS_MAP)
        sampler2D   metallicRoughnessTexture; //G: roughness B: metallic
    #else
        float       metallicFactor;
        float       roughnessFactor;
    #endif

    //https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#occlusiontextureinfo
    #if defined(MATERIAL_HAS_AMBIENT_OCCLUSION)
        #if defined(MATERIAL_HAS_AO_MAP)
            sampler2D occlusionTexture;    // default: 0.0
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
        vec4 postLightingColor;   // default: vec4(0.0)
    #endif

        //TODO reflectance 是否能做成材质？
        float reflectance;         // default: 0.5, not available with cloth
    #if defined(MATERIAL_HAS_CLEAR_COAT)
            float clearCoat;           // default: 1.0, 是否是clearCoat, 0 or 1
        #if defined(MATERIAL_HAS_CLEARCOAT_ROUGNESS_MAP)
            sampler2D clearCoatRoughnessTexture;
        #else
            float clearCoatRoughness;  // default: 0.0
        #endif

        #if defined(MATERIAL_HAS_CLEAR_COAT_NORMAL)
            sampler2D clearCoatNormalTexture;     // default: vec3(0.0, 0.0, 1.0)
        #endif
    #endif

    #if defined(MATERIAL_HAS_ANISOTROPY)
        //TODO 是否能定义成纹理？
        float anisotropy;          // default: 0.0
        vec3 anisotropyDirection; // default: vec3(1.0, 0.0, 0.0)
    #endif

    //TODO subsurface模型的定义
    // only available when the shading model is subsurface
    // float thickness;           // default: 0.5
    // float subsurfacePower;     // default: 12.234
    // vec3 subsurfaceColor;     // default: vec3(1.0)

    //TODO cloth模型的定义
    // only available when the shading model is cloth
    // vec3 sheenColor;          // default: sqrt(baseColor)
    // vec3 subsurfaceColor;     // default: vec3(0.0)

    // not available when the shading model is unlit
    // must be set before calling prepareMaterial()
    #if defined(MATERIAL_HAS_NORMAL)
        sampler2D normalTexture;              // default: vec3(0.0, 0.0, 1.0)
    #endif
} material;

void material(out MaterialVertexInputs materialInputs) {
    #if defined(MATERIAL_HAS_BASECOLOR_MAP)
        materialInputs.baseColor = texture2D(material.baseColorTexture, vTexCoord);
    #else
        materialInputs.baseColor = baseColorFactor;
    #endif

    #if defined(MATERIAL_HAS_METALLICROUGHNESS_MAP)
        vec2 roughnessMetallic = texture2D(material.metallicRoughnessTexture).gb;
        materialInputs.roughness = roughnessMetallicp[0];
        #if !defined(SHADING_MODEL_CLOTH)
            materialInputs.metallic = roughnessMetallic[1];
        #endif
    #else
        materialInputs.roughness = material.roughnessFactor;
        #if !defined(SHADING_MODEL_CLOTH)
            materialInputs.metallic = material.metallicFactor;
        #endif
    #endif

    #if !defined(SHADING_MODEL_CLOTH)
        //TODO 可能需要从纹理中读取
        materialInputs.reflectance = material.reflectance;
    #endif

    #if defined(MATERIAL_HAS_AO_MAP)
        materialInputs.ambientOcclusion = texture2D(material.occlusionTexture, vTexCoord).r;
    #else
        materialInputs.ambientOcclusion = material.occlusion;
    #endif
    materialInputs.ambientOcclusion *= material.occlusionStrength;

    #if defined(MATERIAL_HAS_EMISSIVE)
        #if defined(MATERIAL_HAS_EMISSIVE_MAP)
            materialInputs.emissive = texture2D(material.emissiveTexture, vTexCoord);
        #else
            materialInputs.emissive = material.emissiveFactor;
        #endif
    #endif

    #if defined(MATERIAL_HAS_CLEAR_COAT)
        materialInputs.clearCoat = material.clearCoat;
        #if defined(MATERIAL_HAS_CLEARCOAT_ROUGNESS_MAP)
            materialInputs.clearCoatRoughness = texture2D(material.clearCoatRoughnessTexture, vTexCoord).g;
        #else
            materialInputs.clearCoatRoughness = material.clearCoatRoughness;
        #endif

        #if defined(MATERIAL_HAS_CLEAR_COAT_NORMAL)
            materialInputs.clearCoatNormal = texture2D(material.clearCoatNormalTexture, vTexCoord).xyz;
        #endif
    #endif

    #if defined(MATERIAL_HAS_ANISOTROPY)
        materialInputs.anisotropy = material.anisotropy;
        materialInputs.anisotropyDirection = material.anisotropyDirection;
    #endif

    #if defined(MATERIAL_HAS_NORMAL)
        materialInputs.normal = texture2D(material.normalTexture, vTexCoord).xyz;
    #endif

    #if defined(MATERIAL_HAS_POST_LIGHTING_COLOR)
        materialInputs.postLightingColor = material.postLightingColor;
    #endif
}
