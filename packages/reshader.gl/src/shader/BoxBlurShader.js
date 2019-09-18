import frag from './glsl/box_blur.frag';
import vert from './glsl/quad.vert';
import QuadShader from './QuadShader.js';

class BoxBlurShader extends QuadShader {

    constructor({ blurOffset }) {
        super({
            vert, frag,
            uniforms : ['textureSource', 'resolution'],
            defines : {
                'BOXBLUR_OFFSET' : blurOffset || 2
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['shadow']) {
            this.commands['shadow'] = this.createREGLCommand(
                regl,
                null,
                mesh.getAttributes(),
                null,
                mesh.getElements()
            );
        }
        return this.commands['shadow'];
    }
}

export default BoxBlurShader;
