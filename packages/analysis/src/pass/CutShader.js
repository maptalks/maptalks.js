import { mat4, mat3 } from '@maptalks/gl';
import { reshader } from '@maptalks/gl';
import frag from './glsl/cutShader.frag';
import vert from './glsl/cutShader.vert';

class CutShader extends reshader.MeshShader {
    constructor(config = {}) {
        const normalMatrix = [];
        const modelViewMatrix = [];
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
        this.version = 300;
    }
}
export default CutShader;
