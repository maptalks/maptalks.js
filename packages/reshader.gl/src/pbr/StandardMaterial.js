import Material from '../Material.js';
import { mat3 } from 'gl-matrix';

const DEFAULT_UNIFORMS = {
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
    'uEnvironmentExposure': 2, //2
    // 'uFrameMod', //
    'uGlossinessPBRFactor': 0.4, //0.4
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
    'uNormalMapFlipY': 1, //1
    'uOutputLinear': 1, //1
    'uEnvironmentTransform': mat3.identity([]), //0.5063, -0.0000, 0.8624, 0.6889, 0.6016, -0.4044, -0.5188, 0.7988, 0.3046
    'uAlbedoTexture': null, //albedo color
    'uNormalTexture': null,
    'uOcclusionTexture': null,
    'uMetallicRoughnessTexture': null,
    'uEmitTexture': null,

    // 'sIntegrateBRDF': null,
    // 'sSpecularPBR': null,
    // 'uNearFar', //unused
    // 'uShadow_Texture3_depthRange',
    // 'uShadow_Texture3_renderSize',
    // 'uTextureEnvironmentSpecularPBRLodRange': [8, 5], //8, 5
    // 'uTextureEnvironmentSpecularPBRTextureSize': [256, 256], //256,256
    'uClearCoatTint': [0.0060, 0.0060, 0.0060], //0.0060, 0.0060, 0.0060
    // 'uDiffuseSPH[9]': null,
    // 'uShadow_Texture3_projection',
    // 'uSketchfabLight0_viewDirection',
    // 'uSketchfabLight1_viewDirection',
    // 'uSketchfabLight2_viewDirection',
    // 'uSketchfabLight3_viewDirection',
    // 'uSubsurfaceTranslucencyColor', //1, 0.3700, 0.3000
    // 'uHalton', //0.0450, -0.0082, 1, 5
    // 'uShadow_Texture3_viewLook',
    // 'uShadow_Texture3_viewRight',
    // 'uShadow_Texture3_viewUp',
    // 'uSketchfabLight0_diffuse',
    // 'uSketchfabLight1_diffuse',
    // 'uSketchfabLight2_diffuse',
    // 'uSketchfabLight3_diffuse',
};

class StandardMaterial extends Material {
    constructor(uniforms) {
        super(uniforms, DEFAULT_UNIFORMS);
    }

    createDefines() {
        const uniforms = this.uniforms;
        const defines = {
        };
        if (uniforms['uAlbedoTexture']) {
            defines['HAS_ALBEDO_MAP'] = 1;
        }
        if (uniforms['uMetallicRoughnessTexture']) {
            defines['HAS_METALLICROUGHNESS_MAP'] = 1;
        }
        if (uniforms['uOcclusionTexture']) {
            defines['HAS_AO_MAP'] = 1;
        }
        if (uniforms['uEmitTexture']) {
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
        if (uniforms['HAS_TONE_MAPPING']) {
            defines['HAS_TONE_MAPPING'] = 1;
        }
        if (uniforms['GAMMA_CORRECT_INPUT']) {
            defines['GAMMA_CORRECT_INPUT'] = 1;
        }
        return defines;
    }
}

export default StandardMaterial;
