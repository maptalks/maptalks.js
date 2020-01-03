import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssao_mipmap.frag';

class SsaoMipmapShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            uniforms : [
                'TextureDepth0',
                'TextureDepth1',
                'TextureDepth2',
                'TextureDepth3',
                'TextureDepth4',
                'TextureDepth5',
                'uTextureDepth0Ratio',
                'uTextureDepth0Size',
                'uTextureDepth1Ratio',
                'uTextureDepth1Size',
                'uTextureDepth2Ratio',
                'uTextureDepth2Size',
                'uTextureDepth3Ratio',
                'uTextureDepth3Size',
                'uTextureDepth4Ratio',
                'uTextureDepth4Size',
                'uTextureDepth5Ratio',
                'uTextureDepth5Size',
                'uTextureOutputRatio',
                'uTextureOutputSize',
                'uNearFar',
                'projMatrix'
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
        if (!this.commands['ssao_mimap']) {
            this.commands['ssao_mimap'] = this.createREGLCommand(
                regl,
                null,
                ['aPosition', 'aTexCoord'],
                null,
                mesh.getElements()
            );
        }
        return this.commands['ssao_mimap'];
    }
}

export default SsaoMipmapShader;
