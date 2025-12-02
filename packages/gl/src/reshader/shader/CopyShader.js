import QuadShader from './QuadShader.js';
import frag from './glsl/copy.frag';
import wgslFrag from './wgsl/copy_frag.wgsl';

class CopyShader extends QuadShader {
    constructor() {
        super({
            name: 'copy',
            wgslFrag,
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
        const key = this.dkey || '';
        const cmdKey = key + '_copy';
        if (!this.commands[cmdKey]) {
            this.commands[cmdKey] = this.createMeshCommand(regl, mesh);
        }
        return this.commands[cmdKey];
    }
}

export default CopyShader;
