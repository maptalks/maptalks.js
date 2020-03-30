import frag from './glsl/box_color_blur.frag';
import vert from './glsl/quad.vert';
import QuadShader from './QuadShader.js';

class BoxColorBlurShader extends QuadShader {

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
        if (!this.commands['box_color_blur']) {
            this.commands['box_color_blur'] = this.createREGLCommand(
                regl,
                null,
                ['aPosition', 'aTexCoord'],
                null,
                mesh.getElements()
            );
        }
        return this.commands['box_color_blur'];
    }
}

export default BoxColorBlurShader;
