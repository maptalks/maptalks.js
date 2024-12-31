import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/copy.frag';

class CopyShader extends QuadShader {
    constructor() {
        super({
            vert,
            frag,
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['size'][0];
                    },
                    height: (context, props) => {
                        return props['size'][1];
                    }
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['copy']) {
            this.commands['copy'] = this.createMeshCommand(
                regl,
                null,
                mesh.getElements()
            );
        }
        return this.commands['copy'];
    }
}

export default CopyShader;
