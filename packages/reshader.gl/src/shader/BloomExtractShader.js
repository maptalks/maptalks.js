import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/bloom_extract.frag';

class BloomExtractShader extends QuadShader {
    constructor(viewport) {
        super({
            vert, frag,
            uniforms : [
                'uRGBMRange', 'uBloomThreshold',
                'TextureInput', 'uTextureInputRatio', 'uTextureInputSize',
                'uTextureOutputSize'
            ],
            extraCommandProps: {
                viewport
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
