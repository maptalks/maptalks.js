import { mat4, mat3 } from 'gl-matrix';
import frag from './glsl/StandardLite.frag';
import vert from './glsl/StandardLite.vert';
import MeshShader from '../shader/MeshShader.js';

const TEMP_MAT4 = [];
const environmentTransform = [];
class StandardLiteShader extends MeshShader {
    constructor(config = {}) {
        const modelViewMatrix = [];
        const extraUniforms = config.uniforms;
        const uniforms = [
            {
                name: 'viewMatrixInverse',
                type: 'function',
                fn: (_, props) => {
                    return mat4.invert(TEMP_MAT4, props['viewMatrix']);
                }
            },
            {
                name: 'modelViewMatrix',
                type: 'function',
                fn: function (context, props) {
                    return mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                }
            },
            {
                name: 'environmentTransform',
                type: 'function',
                fn: (_, props) => {
                    const orientation = props['environmentOrientation'] || 0;
                    return mat3.fromRotation(environmentTransform, Math.PI * orientation / 180);
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
export default StandardLiteShader;
