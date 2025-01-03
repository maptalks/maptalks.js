import { mat4 } from 'gl-matrix';
import shadowDisplayFrag from './glsl/shadow_display.frag';
import shadowDisplayVert from './glsl/shadow_display.vert';
import MeshShader from '../shader/MeshShader.js';

class ShadowDisplayShader extends MeshShader {

    constructor(defines) {
        super({
            vert : shadowDisplayVert,
            frag : shadowDisplayFrag,
            uniforms : [
                {
                    name : 'modelViewMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        const modelViewMatrix = [];
                        mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                        return modelViewMatrix;
                    }
                }
            ],
            defines : defines || {
                'USE_ESM': 1
            },
            extraCommandProps: {
                depth: {
                    enable: true,
                    mask: false
                },
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['globalTexSize'][0];
                    },
                    height: (context, props) => {
                        return props['globalTexSize'][1];
                    }
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['shadow_display']) {
            this.commands['shadow_display'] = this.createMeshCommand(regl, mesh);
        }
        return this.commands['shadow_display'];
    }
}

export default ShadowDisplayShader;
