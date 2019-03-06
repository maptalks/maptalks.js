import Material from './Material.js';

const defaultUniforms = {
    'frontColor' : [1, 0, 0, 1],
    'backColor' : [1, 0, 0, 0.6],
    'lineWidth' : 2.0,
    'fillColor' : [1, 0, 1, 1],
    'opacity' : 1.0

};

class WireFrameMaterial extends Material {
    constructor(uniforms) {
        super(uniforms, defaultUniforms);
    }
}
export default WireFrameMaterial;
