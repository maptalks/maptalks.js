import boxBlurFrag from './glsl/box_blur.frag';
import boxBlurVert from './glsl/box_blur.vert';
import QuadShader from '../shader/QuadShader.js';

class BoxBlurShader extends QuadShader {

    constructor({ blurOffset }) {
        super({
            vert : boxBlurVert, frag : boxBlurFrag,
            uniforms : ['textureSource', 'textureSize'],
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
