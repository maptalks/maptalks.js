import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssao_blur_h.frag';

class SsaoBlurHShader extends QuadShader {
    constructor(viewport) {
        super({
            vert, frag,
            uniforms : [
                'TextureBlurInput',
                'uTextureBlurInputRatio',
                'uTextureBlurInputSize',
                'uTextureOutputRatio',
                'uTextureOutputSize'
            ],
            extraCommandProps: {
                viewport
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['ssao_blurh']) {
            this.commands['ssao_blurh'] = this.createREGLCommand(
                regl,
                null,
                ['aPosition', 'aTexCoord'],
                null,
                mesh.getElements()
            );
        }
        return this.commands['ssao_blurh'];
    }
}

export default SsaoBlurHShader;
