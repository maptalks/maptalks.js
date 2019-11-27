import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/ssao_blur.frag';

class SsaoBlurShader extends QuadShader {
    constructor(viewport) {
        super({
            vert, frag,
            uniforms : [
                'resolution',
                'projMatrix',
                'materialParams_depth', 'materialParams_ssao',
                'axis'
            ],
            extraCommandProps: {
                viewport
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['ssao_blur']) {
            this.commands['ssao_blur'] = this.createREGLCommand(
                regl,
                null,
                ['aPosition', 'aTexCoord'],
                null,
                mesh.getElements()
            );
        }
        return this.commands['ssao_blur'];
    }
}

export default SsaoBlurShader;
