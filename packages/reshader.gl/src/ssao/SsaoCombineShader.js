import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssao_combine.frag';

class SsaoCombineShader extends QuadShader {
    constructor(viewport) {
        super({
            vert, frag,
            uniforms : [
                'uRGBMRange',
                'TextureBlurInput',
                'TextureInput',
                'uTextureBlurInputRatio',
                'uTextureBlurInputSize',
                'uTextureInputRatio',
                'uTextureInputSize',
                'uTextureOutputRatio',
                'uTextureOutputSize'
            ],
            extraCommandProps: {
                viewport
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['ssao_combine']) {
            this.commands['ssao_combine'] = this.createREGLCommand(
                regl,
                null,
                ['aPosition', 'aTexCoord'],
                null,
                mesh.getElements()
            );
        }
        return this.commands['ssao_combine'];
    }
}

export default SsaoCombineShader;
