import { mat4 } from 'gl-matrix';
import MeshShader from '../shader/MeshShader.js';
import vert from './glsl/depth.vert';
import frag from './glsl/depth.frag';
// 2021-02-05
// ssr逻辑修改后不再需要
class StandardDepthShader extends MeshShader {
    constructor(config = {}) {
        const modelViewMatrix = [];
        const uniforms = [
            {
                name : 'modelViewMatrix',
                type : 'function',
                fn : (context, props) => {
                    return mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                }
            }
        ];
        const extraCommandProps = config.extraCommandProps;
        super({
            vert,
            frag,
            uniforms,
            extraCommandProps,
            defines: config.defines
        });
    }
}

export default StandardDepthShader;
