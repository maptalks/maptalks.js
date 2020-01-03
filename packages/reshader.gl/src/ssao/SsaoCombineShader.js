import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssao_combine.frag';

class SsaoCombineShader extends QuadShader {
    constructor() {
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
