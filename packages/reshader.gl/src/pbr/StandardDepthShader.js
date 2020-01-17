import { mat4 } from 'gl-matrix';
import MeshShader from '../shader/MeshShader.js';
import vert from './glsl/depth.vert';
import frag from './glsl/depth.frag';
import { extend } from '../common/Util';

class StandardDepthShader extends MeshShader {
    constructor(config = {}) {
        const uniforms = [
            'positionMatrix',
            'uGlobalTexSize',
            'uHalton',
            'lineWidth',
            'lineHeight',
            'linePixelScale',
            'projMatrix',
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
        const extraCommandProps = config.extraCommandProp ? extend({}, config.extraCommandProp) : {};
        extraCommandProps['colorMask'] = [false, false, false, false];
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
