import { mat4 } from '@mapbox/gl-matrix';
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
                    name : 'lightProjViewModel',
                    type : 'function',
                    fn : function (context, props) {
                        return mat4.multiply([], props['lightProjView'], props['model']);
                    }
                }
            ]

        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['vsm']) {
            this.commands['vsm'] = this.createREGLCommand(
                regl,
                null,
                mesh.getAttributes(regl),
                null,
                mesh.getElements(regl)
            );
        }
        return this.commands['vsm'];
    }
}

export default VSMShadowShader;
