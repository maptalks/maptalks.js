import Material from './Material.js';

const DEFAULT_UNIFORMS = {
    // 'lightPosition' : [0.0, 0.0, 50.0],
    'lightAmbient' : [0.5, 0.5, 0.5, 1.0],
    'lightDiffuse' : [0.8, 0.8, 0.8, 1.0],
    'lightSpecular' : [1.0, 1.0, 1.0, 1.0],

    'baseColorFactor': [1, 1, 1],
    'materialShiness' : 32.0,
    'ambientStrength' : 1,
    'specularStrength' : 32,
    'opacity' : 1.0,
    'extrusionOpacity': 0,
    'extrusionOpacityRange': [0, 1.8]
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
        if (uniforms['extrusionOpacity']) {
            defines['HAS_EXTRUSION_OPACITY'] = 1;
        }
        return defines;
    }
}
export default PhongMaterial;
