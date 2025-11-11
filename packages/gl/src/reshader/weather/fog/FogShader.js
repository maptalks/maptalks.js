import QuadShader from '../../shader/QuadShader.js';
import vert from '../../shader/glsl/quad.vert';
import frag from './glsl/fog.frag';

class FogShader extends QuadShader {
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

    // getMeshCommand(regl, mesh) {
    //     const key = this.dkey || '';
    //     if (!this.commands[key + '_fxaa']) {
    //         this.commands[key + '_fxaa'] = this.createMeshCommand(
    //             regl,
    //             null,
    //             mesh.getElements()
    //         );
    //     }
    //     return this.commands[key + '_fxaa'];
    // }
}

export default FogShader;
