import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssr_combine.frag';

class SsrShaderShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            uniforms : [
                'uTextureOutputSize',
                'TextureInput',
                'TextureSSR'
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
        if (!this.commands['ssr_combine']) {
            this.commands['ssr_combine'] = this.createREGLCommand(
                regl,
                null,
                null,
                mesh.getElements()
            );
        }
        return this.commands['ssr_combine'];
    }
}

export default SsrShaderShader;
