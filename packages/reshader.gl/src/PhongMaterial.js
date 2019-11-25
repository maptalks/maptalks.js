import Material from './Material.js';

const DEFAULT_UNIFORMS = {
    'baseColorFactor': [1, 1, 1, 1],
    'materialShininess' : 32.0,
    'ambientStrength' : 1,
    'specularStrength' : 32,
    'opacity' : 1.0,
    'extrusionOpacity': 0,
    'extrusionOpacityRange': [0, 1.8],

    'baseColorTexture': null,
    'normalTexture': null,
    'emissiveTexture': null,
    'uOcclusionTexture': null
};

class PhongMaterial extends Material {
    constructor(uniforms) {
        super(uniforms, DEFAULT_UNIFORMS);
    }

    createDefines() {
        const defines = super.createDefines();
        const uniforms = this.uniforms;
        if (uniforms['baseColorTexture']) {
            defines['HAS_BASECOLOR_MAP'] = 1;
        }
        if (uniforms['extrusionOpacity']) {
            defines['HAS_EXTRUSION_OPACITY'] = 1;
        }
        if (uniforms['occlusionTexture']) {
            defines['HAS_AO_MAP'] = 1;
        }
        if (uniforms['emissiveTexture']) {
            defines['HAS_EMISSIVE_MAP'] = 1;
        }
        if (uniforms['normalTexture']) {
            defines['HAS_NORMAL_MAP'] = 1;
        }
        if (defines['HAS_BASECOLOR_MAP'] ||
            defines['HAS_AO_MAP'] ||
            defines['HAS_EMISSIVE_MAP'] ||
            defines['HAS_NORMAL_MAP']) {
            defines['HAS_MAP'] = 1;
        }
        return defines;
    }
}
export default PhongMaterial;
