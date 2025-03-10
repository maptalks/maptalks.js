import MeshShader from './MeshShader.js';
import vert from './glsl/image.vert';
import frag from './glsl/image.frag';
import wgslVert from './wgsl/image_vert.wgsl';
import wgslFrag from './wgsl/image_frag.wgsl';

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
            wgslVert,
            wgslFrag,
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

    getMeshCommand(regl, mesh) {
        const key = mesh.getCommandKey(regl);
        if (!this.commands['image_' + key]) {
            this.commands['image_' + key] = this.createMeshCommand(regl, mesh);
        }
        return this.commands['image_' + key];
    }
}

export default ImageShader;
