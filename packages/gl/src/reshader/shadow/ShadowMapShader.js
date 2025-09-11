import { mat4 } from 'gl-matrix';
import vsmFrag from './glsl/vsm_mapping.frag';
import vsmVert from './glsl/vsm_mapping.vert';
import MeshShader from '../shader/MeshShader.js';

class ShadowMapShader extends MeshShader {

    constructor(defines) {
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
            ],
            extraCommandProps: {
                // cull: {
                //     enable: true,
                //     face: 'back'
                // }
            },
            defines
        });
    }

    filter(mesh) {
        return mesh.castShadow;
    }
}

export default ShadowMapShader;
