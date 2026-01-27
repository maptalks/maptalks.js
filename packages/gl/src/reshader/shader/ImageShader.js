import { getWGSLSource } from '../gpu/WGSLSources';
import MeshShader from './MeshShader.js';
import vert from './glsl/image.vert';
import frag from './glsl/image.frag';
import { mat4 } from 'gl-matrix';

class ImageShader extends MeshShader {
    constructor(config) {
        const projViewModelMatrix = [];
        const extraCommandProps = config ? config.extraCommandProps || {} : {};
        config.vert = vert;
        config.frag = frag;
        super({
            name: 'image',
            vert,
            frag,
            wgslVert: getWGSLSource('gl_image_vert'),
            wgslFrag: getWGSLSource('gl_image_frag'),
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps
        });
    }

    getMeshCommand(regl, mesh, renderProps) {
        const key = this.getShaderCommandKey(regl, mesh, renderProps);
        const meshKey = mesh.getCommandKey(regl);
        const dKey = key + '_' + meshKey;
        if (!this.commands['image_' + dKey]) {
            this.commands['image_' + dKey] = this.createMeshCommand(regl, mesh, null, renderProps);
        }
        return this.commands['image_' + dKey];
    }
}

export default ImageShader;
