import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssao_depth.frag';

class SsaoDepthShader extends QuadShader {
    constructor(viewport) {
        super({
            vert, frag,
            uniforms : [
                'uFirstDepth',
                'uTextureDepthRatio',
                'uTextureDepthSize',
                'uTextureOutputRatio',
                'uTextureOutputSize',
                'TextureDepth',
                'projMatrix',
                'uNearFar'
            ],
            extraCommandProps: {
                viewport
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['ssao_depth']) {
            this.commands['ssao_depth'] = this.createREGLCommand(
                regl,
                null,
                ['aPosition', 'aTexCoord'],
                null,
                mesh.getElements()
            );
        }
        return this.commands['ssao_depth'];
    }
}

export default SsaoDepthShader;
