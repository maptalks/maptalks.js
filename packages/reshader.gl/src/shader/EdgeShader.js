import { mat4 } from 'gl-matrix';
import frag from './glsl/edge.frag';
import vert from './glsl/edge.vert';
import MeshShader from '../shader/MeshShader.js';

class EdgeShader extends MeshShader {
    constructor(config = {}) {
        const modelViewMatrix = [];
        const extraUniforms = config.uniforms;
        const uniforms = [
            {
                name: 'modelViewMatrix',
                type: 'function',
                fn: function (context, props) {
                    return mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                }
            }
        ];
        if (extraUniforms) {
            uniforms.push(...extraUniforms);
        }
        super({
            vert,
            frag,
            uniforms,
            defines: config.defines || {},
            extraCommandProps: config.extraCommandProps || {}
        });
    }
}
export default EdgeShader;
