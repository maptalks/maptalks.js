import frag from './glsl/box_blur.frag';
import vert from './glsl/quad.vert';
import QuadShader from './QuadShader.js';

class BoxBlurShader extends QuadShader {

    constructor({ blurOffset }) {
        super({
            vert, frag,
            defines : {
                'BOXBLUR_OFFSET' : blurOffset || 2
            },
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['resolution'][0];
                    },
                    height: (context, props) => {
                        return props['resolution'][1];
                    }
                }
            }
        });
        this._blurOffset = blurOffset || 2;
    }

    getMeshCommand(regl, mesh) {
        const key = 'box_blur_' + this._blurOffset;
        if (!this.commands[key]) {
            this.commands[key] = this.createMeshCommand(
                regl,
                null,
                mesh.getElements()
            );
        }
        return this.commands[key];
    }
}

export default BoxBlurShader;
