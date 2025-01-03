import frag from './glsl/box_shadow_blur.frag';
import vert from './glsl/quad.vert';
import QuadShader from './QuadShader.js';

class BoxShadowBlurShader extends QuadShader {

    constructor({ blurOffset }) {
        super({
            vert, frag,
            defines : {
                'BOXBLUR_OFFSET' : blurOffset || 2
            }
        });
        this._blurOffset = blurOffset || 2;
    }

    getMeshCommand(regl, mesh) {
        const key = 'box_shadow_blur_' + this._blurOffset;
        if (!this.commands[key]) {
            this.commands[key] = this.createMeshCommand(regl, mesh);
        }
        return this.commands[key];
    }
}

export default BoxShadowBlurShader;
