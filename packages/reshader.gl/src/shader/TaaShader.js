import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/taa2.frag';

class TaaShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['materialParams_color'].width;
                    },
                    height: (context, props) => {
                        return props['materialParams_color'].height;
                    }
                },
                blend: {
                    enable: false
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['taa']) {
            this.commands['taa'] = this.createMeshCommand(
                regl,
                null,
                mesh.getElements()
            );
        }
        return this.commands['taa'];
    }
}

export default TaaShader;

