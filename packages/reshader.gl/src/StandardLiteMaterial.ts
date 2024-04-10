import Geometry from './Geometry';
import Material from './Material';
import { MaterialUniforms, ShaderDefines } from './types/typings';

const DEFAULT_UNIFORMS: MaterialUniforms = {
    'baseColorFactor': [1, 1, 1, 1],
    'uvScale': [1, 1],
    'uvOffset': [0, 0],
    'opacity': 1,
    'envMapExposure': 128,
    'emissiveFactor': [0.1, 0.1, 0.1],
    'specularFactor': [0, 0, 0],
    'envRotationSin': 0,
    'envRotationCos': 1,
    'reflectivity': 0.01,
    'themingColor': [0, 0, 0, 0],
    'exposureBias': 0.6
};

class StandardLiteMaterial extends Material {
    constructor(uniforms: MaterialUniforms) {
        super(uniforms, DEFAULT_UNIFORMS);
    }

    appendDefines(defines: ShaderDefines, geometry: Geometry) {
        super.appendDefines(defines, geometry);
        const uniforms = this.uniforms;
        if (uniforms['extrusionOpacity']) {
            defines['HAS_EXTRUSION_OPACITY'] = 1;
        }
        if (geometry.data[geometry.desc.colorAttribute]) {
            defines['HAS_COLOR'] = 1;
        }
        const color0 = geometry.data[geometry.desc.color0Attribute];
        if (color0) {
            defines['HAS_COLOR0'] = 1;
            defines['COLOR0_SIZE'] = geometry.getColor0Size();
        }
        if (!geometry.data[geometry.desc.uv0Attribute]) {
            return defines;
        }
        if (uniforms['baseColorTexture']) {
            defines['HAS_BASECOLOR_MAP'] = 1;
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
        if (defines['HAS_BASECOLOR_MAP'] ||
            defines['HAS_AO_MAP'] ||
            defines['HAS_EMISSIVE_MAP'] ||
            defines['HAS_NORMAL_MAP']) {
            defines['HAS_MAP'] = 1;
        }
        defines['ALPHATEST'] = 0.01;
        defines['GAMMA_INPUT'] = 1;
        defines['GAMMA_FACTOR'] = 1;
        defines['TONEMAP_OUTPUT'] = 1;
        defines['ENVMAP_MODE_REFLECTION'] = 1;
        defines['ENV_RGBM'] = 1;
        defines['IRR_RGBM'] = 1;
        return defines;
    }
}
export default StandardLiteMaterial;
