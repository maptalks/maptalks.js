import { mat4 } from 'gl-matrix';
import phongFrag from './glsl/phong.frag';
import phongVert from './glsl/phong.vert';
import MeshShader from '../shader/MeshShader.js';

class PhongShader extends MeshShader {
    constructor(config = {}) {
        super({
            vert: phongVert,
            frag: phongFrag,
            uniforms: [
                {
                    name: 'normalMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        const normalMatrix = [];
                        mat4.invert(normalMatrix, props['modelMatrix']);
                        mat4.transpose(normalMatrix, normalMatrix);
                        return normalMatrix;
                    }
                },
                {
                    name: 'viewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            defines: config.defines || {},
            extraCommandProps: config.extraCommandProps || {}
        });
    }
}
export default PhongShader;
