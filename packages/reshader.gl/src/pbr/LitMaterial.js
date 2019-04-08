import Material from '../Material.js';

const DEFAULT_UNIFORMS = {
    baseColorTexture : null,
    baseColorFactor : [1, 1, 1],

    metallicRoughnessTexture: null,
    metallicFactor : 1,
    roughnessFactor : 1,

    occlusionTexture: null,
    occlusion: 0,   //filament: ambientOcclusion
    occlusionStrength: 1, //filament: ambientStrength

    normalMap : null,
    normalStrength : 1,
    emissionMap : null,

    reflectance: 0.5,

    emissiveTexture: null,
    emissiveFactor: [0, 0, 0, 0],

    clearCoat: 1,
    clearCoatRoughnessTexture: null,
    clearCoatRoughness: 0,
    clearCoatNormalTexture: null,

    anisotropy: 0,
    anisotropyDirection: [1, 0, 0],

    normalTexture: null,

    postLightingColor: [0, 0, 0, 0]
};

class LitMaterial extends Material {
    constructor(uniforms) {
        super(uniforms, DEFAULT_UNIFORMS);
    }

    createDefines() {
        const uniforms = this.uniforms;
        const defines = {};
        if (uniforms['baseColorTexture']) {
            defines['MATERIAL_HAS_BASECOLOR_MAP'] = 1;
        }
        if (uniforms['metallicRoughnessTexture']) {
            defines['MATERIAL_HAS_METALLICROUGHNESS_MAP'] = 1;
        }
        if (uniforms['occlusionTexture']) {
            defines['MATERIAL_HAS_AO_MAP'] = 1;
        }
        if (uniforms['emissiveTexture']) {
            defines['MATERIAL_HAS_EMISSIVE_MAP'] = 1;
        }
        if (uniforms['clearCoatRoughnessTexture']) {
            defines['MATERIAL_HAS_CLEARCOAT_ROUGNESS_MAP'] = 1;
        }
        if (uniforms['clearCoatNormalTexture']) {
            defines['MATERIAL_HAS_CLEAR_COAT_NORMAL'] = 1;
        }
        if (uniforms['anisotropy'] !== undefined) {
            defines['MATERIAL_HAS_ANISOTROPY'] = 1;
        }
        if (uniforms['normalTexture']) {
            defines['MATERIAL_HAS_NORMAL'] = 1;
        }
        if (uniforms['postLightingColor']) {
            defines['MATERIAL_HAS_POST_LIGHTING_COLOR'] = 1;
        }
        if (defines['MATERIAL_HAS_BASECOLOR_MAP'] ||
            defines['MATERIAL_HAS_METALLICROUGHNESS_MAP'] ||
            defines['MATERIAL_HAS_METMATERIAL_HAS_AO_MAPALLICROUGHNESS_MAP'] ||
            defines['MATERIAL_HAS_EMISSIVE_MAP'] ||
            defines['MATERIAL_HAS_CLEARCOAT_ROUGNESS_MAP'] ||
            defines['MATERIAL_HAS_CLEAR_COAT_NORMAL']) {
            defines['MATERIAL_HAS_MAP'] = 1;
        }
        return defines;
    }


}

export default LitMaterial;
