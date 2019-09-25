import Material from '../Material.js';
import { mat3 } from 'gl-matrix';

const DEFAULT_UNIFORMS = {
    'uBaseColorFactor': [1, 1, 1, 1],
    'uAlbedoPBRFactor': 1, //1
    'uAnisotropyDirection': 0, //0
    'uAnisotropyFactor': 1, //1
    'uClearCoatF0': 0.04, //0.04
    'uClearCoatFactor': 1, //1
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
    'Texture0': null, //albedo color
    // 'Texture15', //shadow
    'Texture1': null, //normal
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
        return {};
    }

}

export default StandardMaterial;
