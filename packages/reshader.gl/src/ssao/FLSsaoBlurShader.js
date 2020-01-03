import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/ssao_blur.frag';

class SsaoBlurShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            uniforms : [
                'resolution',
                'projMatrix',
                'materialParams_depth', 'materialParams_ssao',
                'axis'
            ],
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['resolution'][0];
                    },
                    height: (context, props) => {
                        return props['resolution'][1];
                    }
                }
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
