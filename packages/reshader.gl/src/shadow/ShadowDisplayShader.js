import { mat4 } from '@mapbox/gl-matrix';
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
                    name : 'projectionViewModel',
                    type : 'function',
                    fn : function (context, props) {
                        const projectionViewModel = [];
                        mat4.multiply(projectionViewModel, props['view'], props['model']);
                        mat4.multiply(projectionViewModel, props['projection'], projectionViewModel);
                        return projectionViewModel;
                    }
                },
                `vsm_shadow_lightProjViewModel[${numOfDirLights}]`, `vsm_shadow_shadowMap[${numOfDirLights}]`,
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
                mesh.getAttributes(regl),
                null,
                mesh.getElements(regl)
            );
        }
        return this.commands['shadow_display'];
    }
}

export default ShadowDisplayShader;
