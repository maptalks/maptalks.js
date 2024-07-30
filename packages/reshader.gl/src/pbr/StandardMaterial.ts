import { ShaderUniforms, ShaderDefines } from '../types/typings';
import Material from '../Material';
import { extend } from '../common/Util';
import Geometry from '../Geometry';

const DEFAULT_UNIFORMS: ShaderUniforms = {
    'uvScale': [1, 1],
    'uvOffset': [0, 0],
    'uvRotation': 0,
    'textureOrigin': null,
    'textureWidth': null,

    'baseColorFactor': [1, 1, 1, 1],
    'emissiveFactor': [0, 0, 0],

    'baseColorIntensity': 1, //1
    'emitColorFactor': 1, //1
    'occlusionFactor': 1,
    'roughnessFactor': 0.4,
    'metallicFactor': 0, //0
    'normalMapFactor': 1, //1
    // 'uScatteringFactorPacker', //unused
    // 'uShadowReceive3_bias',
    'specularF0': 0.5, //0.5862
    // 'uStaticFrameNumShadow3', //14
    // 'uSubsurfaceScatteringFactor', //1
    // 'uSubsurfaceScatteringProfile', //unused
    // 'uSubsurfaceTranslucencyFactor': 1, //1
    // 'uSubsurfaceTranslucencyThicknessFactor', //37.4193
    // 'uAnisotropyFlipXY', //unused
    // 'uDrawOpaque', //unused
    'emitMultiplicative': 1, //0
    'normalMapFlipY': 0, //1
    'outputSRGB': 1,

    'baseColorTexture': null,
    'normalTexture': null,
    'occlusionTexture': null,
    'metallicRoughnessTexture': null,
    'emissiveTexture': null,

    'uvOrigin': [0, 0],
    'noiseTexture': null,

    'specularAAVariance': 20,
    'specularAAThreshold': 20,

    'hsv': [0, 0, 0],
    'contrast': 1,

    'bumpTexture': null,
    'bumpScale': 0.05,
    'bumpMinLayers': 5,
    'bumpMaxLayers': 20,
    'alphaTest': 0
};

class StandardMaterial extends Material {
    constructor(uniforms: ShaderUniforms) {
        const defaultUniforms: ShaderUniforms = extend({}, DEFAULT_UNIFORMS);
        if (uniforms['metallicRoughnessTexture'] || uniforms['metallicRoughnessTexture']) {
            defaultUniforms['roughnessFactor'] = 1;
            defaultUniforms['metallicFactor'] = 1;
        }
        super(uniforms, defaultUniforms);
    }

    appendDefines(defines: ShaderDefines, geometry: Geometry) {
        super.appendDefines(defines, geometry);
        const uniforms = this.uniforms;
        // if (uniforms['HAS_TONE_MAPPING']) {
        //     defines['HAS_TONE_MAPPING'] = 1;
        // }
        if (uniforms['GAMMA_CORRECT_INPUT']) {
            defines['GAMMA_CORRECT_INPUT'] = 1;
        }
        if (geometry.data[geometry.desc.colorAttribute]) {
            defines['HAS_COLOR'] = 1;
        }
        const color0 = geometry.data[geometry.desc.color0Attribute];
        if (color0) {
            defines['HAS_COLOR0'] = 1;
            defines['COLOR0_SIZE'] = geometry.getColor0Size();
        }
        if (geometry.data[geometry.desc.tangentAttribute]) {
            defines['HAS_TANGENT'] = 1;
        } else if (geometry.data[geometry.desc.normalAttribute]) {
            defines['HAS_NORMAL'] = 1;
        }

        if (geometry.data['aVertexColorType']) {
            defines['HAS_VERTEX_COLOR'] = 1;
        }

        if (!geometry.data[geometry.desc.uv0Attribute]) {
            return defines;
        }
        if (uniforms['baseColorTexture']) {
            defines['HAS_ALBEDO_MAP'] = 1;
        }
        if (uniforms['metallicRoughnessTexture']) {
            defines['HAS_METALLICROUGHNESS_MAP'] = 1;
        }
        if (uniforms['occlusionTexture'] && geometry.data[geometry.desc['uv1Attribute']]) {
            defines['HAS_AO_MAP'] = 1;
        }
        if (uniforms['emissiveTexture']) {
            defines['HAS_EMISSIVE_MAP'] = 1;
        }
        if (uniforms['normalTexture']) {
            defines['HAS_NORMAL_MAP'] = 1;
        }
        if (uniforms['bumpTexture']) {
            defines['HAS_BUMP_MAP'] = 1;
        }
        if (uniforms['skinTexture']) {
            defines['HAS_SKIN_MAP'] = 1;
        }
        if (defines['HAS_ALBEDO_MAP'] ||
            defines['HAS_METALLICROUGHNESS_MAP'] ||
            defines['HAS_AO_MAP'] ||
            defines['HAS_EMISSIVE_MAP'] ||
            defines['HAS_NORMAL_MAP'] ||
            defines['HAS_BUMP_MAP'] ||
            defines['HAS_SKIN_MAP']) {
            defines['HAS_MAP'] = 1;
        }
        if (uniforms['noiseTexture']) {
            defines['HAS_RANDOM_TEX'] = 1;
        }

        if (geometry.data[geometry.desc.tangentAttribute]) {
            defines['HAS_TANGENT'] = 1;
        } else if (geometry.data[geometry.desc.normalAttribute]) {
            defines['HAS_NORMAL'] = 1;
        }

        return defines;
    }
}

export default StandardMaterial;
