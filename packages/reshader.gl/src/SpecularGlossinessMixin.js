import { extend } from './common/Util.js';

const DEFAULT_UNIFORMS = {
    //KHR_materials_pbrSpecularGlossiness
    'diffuseFactor': [1, 1, 1, 1],
    'specularFactor': [1, 1, 1],
    'glossinessFactor': 1,
    'diffuseTexture': null,
    'specularGlossinessTexture': null,
    'normalTexture': null,
    'emissiveTexture': null,
    'occlusionTexture': null,
};

const SpecularGlossinessable = Base =>
    class extends Base {
        constructor(uniforms) {
            uniforms = extend({}, DEFAULT_UNIFORMS, uniforms || {});
            super(uniforms);
        }

        appendDefines(defines, geometry) {
            super.appendDefines(defines, geometry);
            defines['SHADING_MODEL_SPECULAR_GLOSSINESS'] = 1;
            if (!geometry.data[geometry.desc.uv0Attribute]) {
                return defines;
            }
            const uniforms = this.uniforms;
            if (uniforms['diffuseTexture']) {
                defines['HAS_DIFFUSE_MAP'] = 1;
            }
            if (uniforms['specularGlossinessTexture']) {
                defines['HAS_SPECULARGLOSSINESS_MAP'] = 1;
            }
            if (defines['HAS_SPECULARGLOSSINESS_MAP'] ||
                defines['HAS_DIFFUSE_MAP']) {
                defines['HAS_MAP'] = 1;
            }
            return defines;
        }
    };

export default SpecularGlossinessable;
