import QuadShader from './QuadShader.js';
import frag from './glsl/copy.frag';

class CopyShader extends QuadShader {
    constructor() {
        super({
            frag,
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (_, props) => {
                        return props['size'][0];
                    },
                    height: (_, props) => {
                        return props['size'][1];
                    }
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['copy']) {
            this.commands['copy'] = this.createMeshCommand(regl, mesh);
        }
        return this.commands['copy'];
    }
}

export default CopyShader;
