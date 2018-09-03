import { mat4 } from 'gl-matrix';
import vsmFrag from './glsl/vsm_mapping.frag';
import vsmVert from './glsl/vsm_mapping.vert';
import MeshShader from '../shader/MeshShader.js';

class VSMShadowShader extends MeshShader {

    constructor() {
        super({
            vert : vsmVert,
            frag : vsmFrag,
            uniforms : [
                {
                    name : 'lightProjViewModelMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        return mat4.multiply([], props['lightProjViewMatrix'], props['modelMatrix']);
                    }
                }
            ]

        });
    }

    filter(mesh) {
        return mesh.castShadow;
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['vsm']) {
            this.commands['vsm'] = this.createREGLCommand(
                regl,
                null,
                mesh.getAttributes(),
                null,
                mesh.getElements()
            );
        }
        return this.commands['vsm'];
    }
}

export default VSMShadowShader;
