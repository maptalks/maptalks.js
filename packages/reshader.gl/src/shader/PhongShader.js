import { mat4, mat3 } from 'gl-matrix';
import phongFrag from './glsl/phong.frag';
import phongVert from './glsl/phong.vert';
import MeshShader from '../shader/MeshShader.js';

class PhongShader extends MeshShader {
    constructor(config = {}) {
        const normalMatrix = [];
        const viewModelMatrix = [];
        super({
            vert: phongVert,
            frag: phongFrag,
            uniforms: [
                {
                    name: 'modelNormalMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        // mat4.invert(normalMatrix, props['modelMatrix']);
                        // mat4.transpose(normalMatrix, normalMatrix);
                        // return normalMatrix;
                        return mat3.fromMat4(normalMatrix, props['modelMatrix']);
                    }
                },
                {
                    name: 'viewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(viewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                    }
                }
            ],
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
