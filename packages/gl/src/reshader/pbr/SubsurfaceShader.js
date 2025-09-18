import subsurfaceFrag from './glsl/frag/index_subsurface.frag';
import StandardShader from './StandardShader';

const UNIFORMS = [
    'material.baseColorTexture',
    'material.baseColorFactor',

    'material.metallicRoughnessTexture',
    'material.roughnessFactor',

    'material.occlusionTexture',    // default: 0.0
    'material.occlusion',
    'material.occlusionStrength',

    'material.emissiveTexture',
    'material.emissiveFactor',

    'material.postLightingColor',   // default: vec4(0.0)

    'material.normalTexture',              // default: vec3(0.0, 0.0, 1.0)

    'material.thickness',
    'material.subsurfacePower',
    'material.subsurfaceColor'
];

//http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
class ClothShader extends StandardShader {
    constructor(config = {}) {
        super(config, subsurfaceFrag, UNIFORMS);
    }
}

export default ClothShader;
