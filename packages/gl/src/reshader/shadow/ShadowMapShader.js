import { mat4 } from 'gl-matrix';
import vsmFrag from './glsl/vsm_mapping.frag';
import vsmVert from './glsl/vsm_mapping.vert';
import vsmVertWgsl from './wgsl/vsm_mapping_vert.wgsl';
import vsmFragWgsl from './wgsl/vsm_mapping_frag.wgsl';
import MeshShader from '../shader/MeshShader.js';

class ShadowMapShader extends MeshShader {

    constructor(defines) {
        super({
            name: 'shadow-map',
            vert : vsmVert,
            frag : vsmFrag,
            wgslVert: vsmVertWgsl,
            wgslFrag: vsmFragWgsl,
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

    setDefines(defines) {
        if (!defines['POSITION_TYPE_3']) {
            defines['POSITION_TYPE_3'] = 'vec3f';
        }
        return super.setDefines(defines);
    }

    filter(mesh) {
        return mesh.castShadow;
    }
}

export default ShadowMapShader;
