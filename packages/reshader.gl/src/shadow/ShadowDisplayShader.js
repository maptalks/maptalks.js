import { mat4 } from 'gl-matrix';
import shadowDisplayFrag from './glsl/shadow_display.frag';
import shadowDisplayVert from './glsl/shadow_display.vert';
import MeshShader from '../shader/MeshShader.js';

class ShadowDisplayShader extends MeshShader {

    constructor(viewport) {
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
                'vsm_shadow_lightProjViewModelMatrix',
                'vsm_shadow_shadowMap',
                'vsm_shadow_threshold', //默认0.5
                'color', 'vsm_shadow_opacity'
            ],
            defines : {
            },
            extraCommandProps: {
                viewport
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
