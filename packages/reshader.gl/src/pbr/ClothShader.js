import StandardShader from './StandardShader.js';

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

    'material.sheenColor',
    'material.subsurfaceColor',
];

class ClothShader extends StandardShader {
    constructor(config = {}) {
        super(config, UNIFORMS);
    }
}


export default ClothShader;
