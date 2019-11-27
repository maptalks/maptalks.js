import { mat4 } from 'gl-matrix';
import shadowDisplayFrag from './glsl/shadow_display.frag';
import shadowDisplayVert from './glsl/shadow_display.vert';
import MeshShader from '../shader/MeshShader.js';

class ShadowDisplayShader extends MeshShader {

    constructor(viewport, defines) {
        super({
            vert : shadowDisplayVert,
            frag : shadowDisplayFrag,
            uniforms : [
                'projMatrix',
                {
                    name : 'modelViewMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        const modelViewMatrix = [];
                        mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                        return modelViewMatrix;
                    }
                },
                // {
                //     name : 'projViewModelMatrix',
                //     type : 'function',
                //     fn : function (context, props) {
                //         const projViewModelMatrix = [];
                //         mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                //         mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                //         return projViewModelMatrix;
                //     }
                // },
                'halton',
                'globalTexSize',
                'shadow_lightProjViewModelMatrix',
                'shadow_shadowMap',
                'esm_shadow_threshold', //默认0.5
                'color', 'shadow_opacity'
            ],
            defines : defines || {
                'USE_ESM': 1
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
                ['aPosition'],
                null,
                mesh.getElements()
            );
        }
        return this.commands['shadow_display'];
    }
}

export default ShadowDisplayShader;
