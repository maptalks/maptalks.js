import frag from './glsl/box_shadow_blur.frag';
import wgslFrag from './wgsl/box_shadow_blur_frag.wgsl';
import QuadShader from './QuadShader.js';

class BoxShadowBlurShader extends QuadShader {

    constructor({ blurOffset }) {
        super({
            name: 'box-shadow-blur',
            frag,
            wgslFrag,
            defines : {
                'BOXBLUR_OFFSET' : blurOffset || 2
            }
        });
        this._blurOffset = blurOffset || 2;
    }

    getMeshCommand(regl, mesh) {
        const key = this.dkey + '_box_shadow_blur_' + this._blurOffset;
        if (!this.commands[key]) {
            this.commands[key] = this.createMeshCommand(regl, mesh);
        }
        return this.commands[key];
    }
}

export default BoxShadowBlurShader;
