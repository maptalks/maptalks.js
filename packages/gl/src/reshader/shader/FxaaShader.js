import QuadShader from './QuadShader.js';
import frag from './glsl/fxaa.frag';
import wgslFrag from './wgsl/fxaa_frag.wgsl';

class FxaaShader extends QuadShader {
    constructor() {
        super({
            name: 'fxaa',
            frag, wgslFrag,
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (_, props) => {
                        return props['resolution'][0];
                    },
                    height: (_, props) => {
                        return props['resolution'][1];
                    }
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        const key = this.dkey || '';
        if (!this.commands[key + '_fxaa']) {
            this.commands[key + '_fxaa'] = this.createMeshCommand(regl, mesh);
        }
        return this.commands[key + '_fxaa'];
    }
}

export default FxaaShader;
