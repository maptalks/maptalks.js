import Material from '../Material.js';
import { mat3 } from 'gl-matrix';
import { extend } from '../common/Util.js';

const DEFAULT_UNIFORMS = {
    'uvScale': [1, 1],
    'uvOffset': [0, 0],

    'uAlbedoPBR': [1, 1, 1, 1],
    'uEmitColor': [0, 0, 0],

    'uAlbedoPBRFactor': 1, //1
    'uAnisotropyDirection': 0, //0
    'uAnisotropyFactor': 0, //1
    'uClearCoatF0': 0.04, //0.04
    'uClearCoatFactor': 0, //1
    'uClearCoatIor': 1.4, //1.4
    'uClearCoatRoughnessFactor': 0.04, //0.04
    'uClearCoatThickness': 5, //5
    'uEmitColorFactor': 1, //1
    'uRoughnessPBRFactor': 0.4, //0.4
    'uMetalnessPBRFactor': 0, //0
    'uNormalMapFactor': 1, //1
    'uRGBMRange': 7, //7
    // 'uScatteringFactorPacker', //unused
    // 'uShadowReceive3_bias',
    'uSpecularF0Factor': 0.5, //0.5862
    // 'uStaticFrameNumShadow3', //14
    // 'uSubsurfaceScatteringFactor', //1
    // 'uSubsurfaceScatteringProfile', //unused
    'uSubsurfaceTranslucencyFactor': 1, //1
    // 'uSubsurfaceTranslucencyThicknessFactor', //37.4193
    // 'uAnisotropyFlipXY', //unused
    // 'uDrawOpaque', //unused
    'uEmitMultiplicative': 0, //0
    'uNormalMapFlipY': 0, //1
    'uOutputLinear': 0, //1
    'uEnvironmentTransform': mat3.identity([]), //0.5063, -0.0000, 0.8624, 0.6889, 0.6016, -0.4044, -0.5188, 0.7988, 0.3046
    'uAlbedoTexture': null, //albedo color
    'uNormalTexture': null,
    'uOcclusionTexture': null,
    'uMetallicRoughnessTexture': null,
    'uEmissiveTexture': null,

    'uClearCoatTint': [0.0060, 0.0060, 0.0060], //0.0060, 0.0060, 0.0060
};

class StandardMaterial extends Material {
    constructor(uniforms) {
        const defaultUniforms = extend({}, DEFAULT_UNIFORMS);
        if (uniforms['uMetallicRoughnessTexture']) {
            defaultUniforms['uRoughnessPBRFactor'] = 1;
            defaultUniforms['uMetalnessPBRFactor'] = 1;
        }
        super(uniforms, defaultUniforms);
    }

    createDefines() {
        const defines = super.createDefines();
        const uniforms = this.uniforms;
        if (uniforms['uAlbedoTexture']) {
            defines['HAS_ALBEDO_MAP'] = 1;
        }
        if (uniforms['uMetallicRoughnessTexture']) {
            defines['HAS_METALLICROUGHNESS_MAP'] = 1;
        }
        if (uniforms['uOcclusionTexture']) {
            defines['HAS_AO_MAP'] = 1;
        }
        if (uniforms['uEmissiveTexture']) {
            defines['HAS_EMISSIVE_MAP'] = 1;
        }
        if (uniforms['uNormalTexture']) {
            defines['HAS_NORMAL_MAP'] = 1;
        }
        if (defines['HAS_ALBEDO_MAP'] ||
            defines['HAS_METALLICROUGHNESS_MAP'] ||
            defines['HAS_AO_MAP'] ||
            defines['HAS_EMISSIVE_MAP'] ||
            defines['HAS_NORMAL_MAP']) {
            defines['HAS_MAP'] = 1;
        }
        // if (uniforms['HAS_TONE_MAPPING']) {
        //     defines['HAS_TONE_MAPPING'] = 1;
        // }
        if (uniforms['GAMMA_CORRECT_INPUT']) {
            defines['GAMMA_CORRECT_INPUT'] = 1;
        }
        return defines;
    }
}

export default StandardMaterial;
