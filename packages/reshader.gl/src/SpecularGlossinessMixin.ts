import Geometry from './Geometry';
import { extend } from './common/Util';
import { ShaderUniforms, MixinConstructor, ShaderDefines } from './types/typings';

const DEFAULT_UNIFORMS: ShaderUniforms = {
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

export default function <T extends MixinConstructor>(Base: T) {
    return class SpecularGlossinessMixin extends Base {
        constructor(...args:any[]) {
            let uniforms = args[0];
            uniforms = extend({}, DEFAULT_UNIFORMS, uniforms || {});
            super(uniforms, args);
        }

        appendDefines(defines: ShaderDefines, geometry: Geometry) {
            //@ts-expect-error 该方法只会由Material的子类调用，所以 super 一定是 Material
            super.appendDefines(defines, geometry);
            defines['SHADING_MODEL_SPECULAR_GLOSSINESS'] = 1;
            if (!geometry.data[geometry.desc.uv0Attribute]) {
                return defines;
            }
            const uniforms = (this as any).uniforms;
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
}
