import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssr_combine.frag';
// 2021-02-05
// ssr逻辑修改后不再需要
class SsrCombineShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['outputSize'][0];
                    },
                    height: (context, props) => {
                        return props['outputSize'][1];
                    }
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['ssr_combine']) {
            this.commands['ssr_combine'] = this.createMeshCommand(
                regl,
                null,
                mesh.getElements()
            );
        }
        return this.commands['ssr_combine'];
    }
}

export default SsrCombineShader;
