import { mat3, mat4 } from 'gl-matrix';
import LitFrag from './glsl/frag/index_lit.frag';
import LitVert from './glsl/vert/index.vert';
import MeshShader from '../shader/MeshShader.js';
import { extend } from '../common/Util';


const MAT4 = [];

//http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
class LitShader extends MeshShader {
    constructor(config = {}) {
        let extraCommandProps = config.extraCommandProps || {};
        const positionAttribute  = config.positionAttribute || 'aPosition';
        const normalAttribute  = config.normalAttribute || 'aNormal';
        const tangentAttribute  = config.tangentAttribute || 'aTangent';
        const colorAttribute  = config.colorAttribute || 'aColor';
        const uv0Attribute = config.uv0Attribute || 'aTexCoord0';
        const uv1Attribute  = config.uv1Attribute || 'aTexCoord1';
        extraCommandProps = extend({}, extraCommandProps, {
            blend : {
                enable: true,
                func: {
                    src: 'src alpha',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            sample: {
                alpha: true
            }
        });
        let vert = LitVert;
        //将着色器代码中的aPosition替换成指定的变量名
        if (positionAttribute !== 'aPosition') {
            vert = vert.replace(/aPosition/g, positionAttribute);
        }
        if (normalAttribute !== 'aNormal') {
            vert = vert.replace(/aNormal/g, normalAttribute);
        }
        if (tangentAttribute !== 'aTangent') {
            vert = vert.replace(/aTangent/g, tangentAttribute);
        }
        if (colorAttribute !== 'aColor') {
            vert = vert.replace(/aColor/g, colorAttribute);
        }
        if (uv0Attribute !== 'aTexCoord0') {
            vert = vert.replace(/aTexCoord0/g, uv0Attribute);
        }
        if (uv1Attribute !== 'aTexCoord1') {
            vert = vert.replace(/aTexCoord1/g, uv1Attribute);
        }
        super({
            vert,
            frag : LitFrag,
            uniforms : [
                //vert中的uniforms
                {
                    name: 'normalMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        // const modelView = mat4.multiply(MAT4, props['viewMatrix'], props['modelMatrix']);
                        // const inverted = mat4.invert(modelView, modelView);
                        // const transposed = mat4.transpose(inverted, inverted);
                        // return mat3.fromMat4([], transposed);
                        return mat3.fromMat4([], props['modelMatrix']);
                    }
                },
                'modelMatrix',
                {
                    name : 'projViewModelMatrix',
                    type : 'function',
                    fn : (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                },
                {
                    name : 'modelViewMatrix',
                    type : 'function',
                    fn : (context, props) => {
                        return mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                    }
                },
                //frag中的uniforms
                'resolution',
                'cameraPosition',
                'time',
                'lightColorIntensity',
                'sun',
                'lightDirection',
                'iblLuminance',
                'exposure',
                'ev100',

                'light_iblDiffuse',

                'light_iblDFG',
                'light_iblSpecular',
                'iblSH[9]',
                //material中的uniforms
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
            ],
            extraCommandProps,
            defines: {
                'IBL_MAX_MIP_LEVEL' : '8.0' //log(256) / log(2), PBRHelper中createPrefilterCube的prefilterCubeSize
            }
        });
        this.positionAttribute = positionAttribute;
        this.normalAttribute = normalAttribute;
        this.tangentAttribute = tangentAttribute;
        this.colorAttribute = colorAttribute;
        this.uv0Attribute = uv0Attribute;
        this.uv1Attribute = uv1Attribute;
    }

    getGeometryDefines(geometry) {
        const defines = {};
        if (geometry.data[this.tangentAttribute]) {
            defines['HAS_ATTRIBUTE_TANGENTS'] = 1;
        }
        if (geometry.data[this.colorAttribute]) {
            defines['HAS_COLOR'] = 1;
            defines['HAS_ATTRIBUTE_COLOR'] = 1;
        }
        if (geometry.data[this.uv0Attribute]) {
            defines['HAS_ATTRIBUTE_UV0'] = 1;
        }
        if (geometry.data[this.uv1Attribute]) {
            defines['HAS_ATTRIBUTE_UV1'] = 1;
        }
        return defines;
    }
}


export default LitShader;
