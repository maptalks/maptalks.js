import litFrag from './glsl/frag/index_lit.frag';
import StandardShader from './FLStandardShader.js';

const UNIFORMS = [
    'material.baseColorTexture',
    'material.baseColorFactor',

    'material.metallicRoughnessTexture',
    'material.metallicFactor',
    'material.roughnessFactor',

    'material.occlusionTexture',    // default: 0.0
    'material.occlusion',
    'material.occlusionStrength',

    'material.emissiveTexture',
    'material.emissiveFactor',

    'material.postLightingColor',   // default: vec4(0.0)

    'material.reflectance',         // default: 0.5, not available with cloth

    'material.clearCoat',           // default: 1.0, 是否是clearCoat, 0 or 1
    'material.clearCoatRoughnessTexture',
    'material.clearCoatRoughness',  // default: 0.0
    'material.clearCoatNormalTexture',     // default: vec3(0.0, 0.0, 1.0)

    'material.anisotropy',          // default: 0.0
    'material.anisotropyDirection', // default: vec3(1.0, 0.0, 0.0)

    'material.normalTexture',              // default: vec3(0.0, 0.0, 1.0)
];

class LitShader extends StandardShader {
    constructor(config = {}) {
        super(config, litFrag, UNIFORMS);
    }
}

export default LitShader;
