import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssao_blur.frag';

class SsaoBlurShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            uniforms : [
                'materialParams_ssao',
                'materialParams.farPlaneOverEdgeDistance',
                'materialParams.axis',
                'materialParams.resolution',
                'TextureInput'
            ],
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['materialParams']['resolution'][0];
                    },
                    height: (context, props) => {
                        return props['materialParams']['resolution'][1];
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
