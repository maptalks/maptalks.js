import PhongMaterial from './PhongMaterial.js';

const DEFAULT_UNIFORMS = {
    'toons': 4,
    'specularToons': 2,
};

class ToonMaterial extends PhongMaterial {
    constructor(uniforms) {
        super(uniforms, DEFAULT_UNIFORMS);
    }
}
export default ToonMaterial;
