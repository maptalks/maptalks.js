import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssao_blur.frag';

class SsaoBlurShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            uniforms : [
                'uTextureOutputSize',
                'projMatrix',
                'materialParams_depth',
                'materialParams_ssao',
                'axis',
                'TextureInput'
            ],
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['uTextureOutputSize'][0];
                    },
                    height: (context, props) => {
                        return props['uTextureOutputSize'][1];
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
