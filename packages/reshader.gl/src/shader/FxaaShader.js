import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/fxaa.frag';

class FxaaShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
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
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['fxaa']) {
            this.commands['fxaa'] = this.createREGLCommand(
                regl,
                null,
                mesh.getElements()
            );
        }
        return this.commands['fxaa'];
    }
}

export default FxaaShader;
