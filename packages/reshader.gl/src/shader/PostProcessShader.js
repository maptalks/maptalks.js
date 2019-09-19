import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/postprocess.frag';

class PostProcessShader extends QuadShader {
    constructor(viewport) {
        super({
            vert, frag,
            uniforms : ['enableVignette', 'enableGrain', 'textureSource', 'resolution', 'timeGrain', 'grainFactor', 'lensRadius', 'frameMod'],
            extraCommandProps: {
                viewport
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['postprocess']) {
            this.commands['postprocess'] = this.createREGLCommand(
                regl,
                null,
                mesh.getAttributes(),
                null,
                mesh.getElements()
            );
        }
        return this.commands['postprocess'];
    }
}

export default PostProcessShader;
