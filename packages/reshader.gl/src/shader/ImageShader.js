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
            vert,
            frag,
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
        const key = mesh.getCommandKey();
        if (!this.commands['image_' + key]) {
            const defines = mesh.getDefines();
            this.commands['image_' + key] = this.createREGLCommand(
                regl,
                defines,
                mesh.getElements()
            );
        }
        return this.commands['image_' + key];
    }
}

export default ImageShader;
