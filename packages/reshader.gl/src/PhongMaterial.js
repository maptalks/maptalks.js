import Material from './Material.js';

const defaultUniforms = {
    'lightAmbient' : [0.5, 0.5, 0.5],
    'lightDiffuse' : [0.2, 0.2, 0.2],
    'lightSpecular' : [1.0, 1.0, 1.0],
    'materialAmbient': [1.0, 0.5, 0.31],
    'materialDiffuse': [1.0, 0.5, 0.31],
    'materialSpecular' : [0.5, 0.5, 0.5],
    'materialShininess' : 32.0,
    'opacity' : 1.0
};

class PhongMaterial extends Material {
    constructor(uniforms) {
        super(uniforms, defaultUniforms);
    }
}
export default PhongMaterial;
