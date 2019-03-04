import Material from './Material.js';

const defaultUniforms = {
    'lightPosition' : [0.0, 0.0, 50.0],
    'lightAmbient' : [0.5, 0.5, 0.5],
    'lightDiffuse' : [0.8, 0.8, 0.8],
    'lightSpecular' : [1.0, 1.0, 1.0],
    'materialShininess' : 32.0,
    'ambientStrength' : 0.5,
    'specularStrength' : 0.8,
    'opacity' : 1.0
};

class PhongMaterial extends Material {
    constructor(uniforms) {
        super(uniforms, defaultUniforms);
    }
}
export default PhongMaterial;
