import { mat4, mat3 } from 'gl-matrix';
import phongFrag from './glsl/phong.frag';
import phongVert from './glsl/phong.vert';
import MeshShader from '../shader/MeshShader.js';

class PhongShader extends MeshShader {
    constructor(config = {}) {
        const normalMatrix = [];
        const viewModelMatrix = [];
        const centerMatrix = [];
        const extraUniforms = config.uniforms;
        const uniforms = [
            {
                name: 'modelNormalMatrix',
                type: 'function',
                fn: function (context, props) {
                    return mat3.fromMat4(normalMatrix, props['modelMatrix']);
                }
            },
            {
                name: 'viewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    return mat4.multiply(viewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                }
            },
            {
                name: 'viewCenterMatrix',
                type: 'function',
                fn: (_, props) => {
                    return mat4.multiply(centerMatrix, props['viewMatrix'], props['centerMatrix']);
                }
            },
        ];
        if (extraUniforms) {
            uniforms.push(...extraUniforms);
        }
        super({
            vert: config.vert || phongVert,
            frag: config.frag || phongFrag,
            uniforms,
            defines: config.defines || {},
            extraCommandProps: config.extraCommandProps || {}
        });
        this.version = 300;
    }

    getGeometryDefines(geometry) {
        const defines = {};
        if (geometry.data[geometry.desc.tangentAttribute]) {
            defines['HAS_TANGENT'] = 1;
        } else if (geometry.data[geometry.desc.normalAttribute]) {
            defines['HAS_NORMAL'] = 1;
        }
        return defines;
    }
}
export default PhongShader;