import Material from '../Material.js';

const DEFAULT_UNIFORMS = {
    baseColorTexture: null,
    baseColorFactor: [1, 1, 1, 1],

    metallicRoughnessTexture: null,
    metallicFactor: 1,
    roughnessFactor: 1,

    occlusionTexture: null,
    occlusion: 0,   //filament: ambientOcclusion
    occlusionStrength: 1, //filament: ambientStrength

    normalTexture: null,
    normalStrength: 1,

    reflectance: 0.5,

    emissiveTexture: null,
    emissiveFactor: [0, 0, 0, 0],

    clearCoat: undefined,
    clearCoatRoughnessTexture: null,
    clearCoatRoughness: 0,
    clearCoatNormalTexture: null,
    clearCoatIorChange: true,

    anisotropy: undefined,
    anisotropyDirection: [1, 0, 0],

    postLightingColor: [0, 0, 0, 0],

    HAS_TONE_MAPPING: 0,

    GAMMA_CORRECT_INPUT: 1,

    uvScale: [1, 1],
    uvOffset: [0, 0]
};

class LitMaterial extends Material {
    constructor(uniforms) {
        super(uniforms, DEFAULT_UNIFORMS);
    }

    createDefines() {
        const defines = super.createDefines();
        const uniforms = this.uniforms;
        defines['BLEND_MODE_TRANSPARENT'] = 1;
        if (uniforms['baseColorFactor'] && uniforms['baseColorFactor'][3] < 1) {
            defines['BLEND_MODE_TRANSPARENT'] = 1;
            defines['TRANSPARENT_MATERIAL'] = 1;
        }
        if (uniforms['baseColorTexture']) {
            defines['MATERIAL_HAS_BASECOLOR_MAP'] = 1;
        }
        if (uniforms['metallicRoughnessTexture']) {
            defines['MATERIAL_HAS_METALLICROUGHNESS_MAP'] = 1;
        }
        if (uniforms['occlusionTexture']) {
            defines['MATERIAL_HAS_AO_MAP'] = 1;
            defines['MATERIAL_HAS_AMBIENT_OCCLUSION'] = 1;
        }
        if (uniforms['emissiveTexture']) {
            defines['MATERIAL_HAS_EMISSIVE_MAP'] = 1;
            defines['MATERIAL_HAS_EMISSIVE'] = 1;
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
        if (uniforms['clearCoat'] !== undefined) {
            defines['MATERIAL_HAS_CLEAR_COAT'] = 1;
        }
        if (uniforms['clearCoatIorChange']) {
            defines['CLEAR_COAT_IOR_CHANGE'] = 1;
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
        if (uniforms['HAS_TONE_MAPPING']) {
            defines['HAS_TONE_MAPPING'] = 1;
        }
        if (uniforms['GAMMA_CORRECT_INPUT']) {
            defines['GAMMA_CORRECT_INPUT'] = 1;
        }
        return defines;
    }

    getUniforms(regl) {
        const uniforms = super.getUniforms(regl);
        return { material: uniforms, uvScale: uniforms.uvScale, uvOffset: uniforms.uvOffset };
    }
}

export default LitMaterial;
