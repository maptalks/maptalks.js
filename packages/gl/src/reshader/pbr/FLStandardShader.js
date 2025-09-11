import { mat3, mat4 } from 'gl-matrix';
import vertSource from './glsl/vert/index.vert';
import MeshShader from '../shader/MeshShader.js';
import { extend } from '../common/Util';


//http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
class StandardShader extends MeshShader {
    constructor(config = {}, frag, materialUniforms) {
        let extraCommandProps = config.extraCommandProps || {};
        extraCommandProps = extend({}, extraCommandProps, {
            blend : {
                enable: true,
                func: {
                    src: 'one',
                    dst: 'one minus src alpha'
                    // srcRGB: 'src alpha',
                    // srcAlpha: 1,
                    // dstRGB: 'one minus src alpha',
                    // dstAlpha: 'one minus src alpha'
                },
                equation: 'add'
            },
            sample: {
                alpha: true
            }
        });
        super({
            vert: vertSource,
            frag,
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
                'uvScale',
                'uvOffset',

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

                'light_iblDFG',
                'light_iblSpecular',
                'light_ambientColor',
                'iblSH[9]',
                'iblMaxMipLevel'
            ].concat(materialUniforms).concat(config.uniforms || []),
            extraCommandProps,
            defines: config.defines
        });
    }

    getGeometryDefines(geometry) {
        const defines = {};
        if (geometry.data[geometry.desc.tangentAttribute] || geometry.data[geometry.desc.normalAttribute]) {
            defines['HAS_ATTRIBUTE_TANGENTS'] = 1;
            if (!geometry.data[this.tangentAttribute]) {
                defines['HAS_ATTRIBUTE_NORMALS'] = 1;
            }
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


export default StandardShader;
