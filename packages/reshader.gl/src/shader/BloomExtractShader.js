//DEPRECATED
import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/bloom_extract.frag';

class BloomExtractShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width : (context, props) => {
                        return props['outputSize'][0];
                    },
                    height : (context, props) => {
                        return props['outputSize'][1];
                    }
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['bloom_extract']) {
            this.commands['bloom_extract'] = this.createMeshCommand(
                regl,
                null,
                mesh.getElements()
            );
        }
        return this.commands['bloom_extract'];
    }
}

export default BloomExtractShader;
