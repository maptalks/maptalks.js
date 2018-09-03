import { mat4 } from 'gl-matrix';
import shadowDisplayFrag from './glsl/shadow_display.frag';
import shadowDisplayVert from './glsl/shadow_display.vert';
import MeshShader from '../shader/MeshShader.js';

class ShadowDisplayShader extends MeshShader {

    constructor(numOfDirLights) {
        super({
            vert : shadowDisplayVert,
            frag : shadowDisplayFrag,
            uniforms : [
                {
                    name : 'projViewModelMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                        mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                        return projViewModelMatrix;
                    }
                },
                `vsm_shadow_lightProjViewModelMatrix[${numOfDirLights}]`,
                `vsm_shadow_shadowMap[${numOfDirLights}]`,
                'color', 'opacity'
            ],
            defines : {
                'NUM_OF_DIR_LIGHTS' : numOfDirLights
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['shadow_display']) {
            this.commands['shadow_display'] = this.createREGLCommand(
                regl,
                null,
                mesh.getAttributes(),
                null,
                mesh.getElements()
            );
        }
        return this.commands['shadow_display'];
    }
}

export default ShadowDisplayShader;
