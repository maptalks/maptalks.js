import Material from './Material.js';

const DEFAULT_UNIFORMS = {
    'lightPosition' : [0.0, 0.0, 50.0],
    'lightAmbient' : [0.5, 0.5, 0.5, 1.0],
    'lightDiffuse' : [0.8, 0.8, 0.8, 1.0],
    'lightSpecular' : [1.0, 1.0, 1.0, 1.0],
    'materialShininess' : 32.0,
    'ambientStrength' : 0.5,
    'specularStrength' : 0.8,
    'opacity' : 1.0
};

class PhongMaterial extends Material {
    constructor(uniforms) {
        super(uniforms, DEFAULT_UNIFORMS);
    }

    createDefines() {
        const defines = super.createDefines();
        const uniforms = this.uniforms;
        if (uniforms['baseColorTexture']) {
            defines['HAS_BASECOLORTEXTURE'] = 1;
        }
        return defines;
    }
}
export default PhongMaterial;
