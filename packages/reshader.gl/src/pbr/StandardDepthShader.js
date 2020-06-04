import { mat4 } from 'gl-matrix';
import MeshShader from '../shader/MeshShader.js';
import vert from './glsl/depth.vert';
import frag from './glsl/depth.frag';

class StandardDepthShader extends MeshShader {
    constructor(config = {}) {
        const uniforms = [
            {
                name : 'uProjectionMatrix',
                type : 'function',
                fn : (context, props) => {
                    return props['projMatrix'];
                }
            },
            {
                name : 'uModelViewMatrix',
                type : 'function',
                fn : (context, props) => {
                    return mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                }
            }
        ];
        const extraCommandProps = config.extraCommandProp;
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
