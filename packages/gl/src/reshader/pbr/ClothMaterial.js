import Material from '../Material.js';

const DEFAULT_UNIFORMS = {
    baseColorTexture : null,
    baseColorFactor : [1, 1, 1, 1],

    metallicRoughnessTexture: null,
    roughnessFactor : 1,

    occlusionTexture: null,
    occlusion: 0,   //filament: ambientOcclusion
    occlusionStrength: 1, //filament: ambientStrength

    normalTexture : null,
    normalStrength : 1,

    emissiveTexture: null,
    emissiveFactor: [0, 0, 0, 0],


    postLightingColor: [0, 0, 0, 0],

    HAS_TONE_MAPPING: 0,

    sheenColor: [-1, -1, -1],          // default: sqrt(baseColor)
    subsurfaceColor: undefined,     // default: float3(0.0)

    uvScale: [1, 1],
    uvOffset: [0, 0]
};

class ClothMaterial extends Material {
    constructor(uniforms) {
        super(uniforms, DEFAULT_UNIFORMS);
    }

    createDefines() {
        const defines = super.createDefines();
        const uniforms = this.uniforms;
        defines['SHADING_MODEL_CLOTH'] = 1;
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
        if (uniforms['normalTexture']) {
            defines['MATERIAL_HAS_NORMAL'] = 1;
        }
        if (uniforms['postLightingColor']) {
            defines['MATERIAL_HAS_POST_LIGHTING_COLOR'] = 1;
        }
        if (defines['MATERIAL_HAS_BASECOLOR_MAP'] ||
            defines['MATERIAL_HAS_METALLICROUGHNESS_MAP'] ||
            defines['MATERIAL_HAS_METMATERIAL_HAS_AO_MAPALLICROUGHNESS_MAP'] ||
            defines['MATERIAL_HAS_EMISSIVE_MAP']) {
            defines['MATERIAL_HAS_MAP'] = 1;
        }
        if (uniforms['HAS_TONE_MAPPING']) {
            defines['HAS_TONE_MAPPING'] = 1;
        }
        if (uniforms['subsurfaceColor'] !== undefined) {
            defines['MATERIAL_HAS_SUBSURFACE_COLOR'] = 1;
        }
        return defines;
    }

    getUniforms(regl) {
        const uniforms = super.getUniforms(regl);
        return { material: uniforms, uvScale: uniforms.uvScale, uvOffset: uniforms.uvOffset };
    }
}

export default ClothMaterial;
