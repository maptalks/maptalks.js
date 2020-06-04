import frag from './glsl/box_blur.frag';
import vert from './glsl/quad.vert';
import QuadShader from './QuadShader.js';

class BoxBlurShader extends QuadShader {

    constructor({ blurOffset }) {
        super({
            vert, frag,
            defines : {
                'BOXBLUR_OFFSET' : blurOffset || 2
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['box_blur']) {
            this.commands['box_blur'] = this.createREGLCommand(
                regl,
                null,
                mesh.getElements()
            );
        }
        return this.commands['box_blur'];
    }
}

export default BoxBlurShader;
