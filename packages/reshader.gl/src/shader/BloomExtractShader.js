import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/bloom_extract.frag';

class BloomExtractShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            uniforms : [
                'uRGBMRange', 'uBloomThreshold',
                'TextureInput', 'uTextureInputRatio', 'uTextureInputSize',
                'uTextureOutputSize'
            ],
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width : (context, props) => {
                        return props['uTextureOutputSize'][0];
                    },
                    height : (context, props) => {
                        return props['uTextureOutputSize'][1];
                    }
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['bloom_extract']) {
            this.commands['bloom_extract'] = this.createREGLCommand(
                regl,
                null,
                ['aPosition', 'aTexCoord'],
                null,
                mesh.getElements()
            );
        }
        return this.commands['bloom_extract'];
    }
}

export default BloomExtractShader;
