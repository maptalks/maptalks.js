import Shader from './Shader.js';
import { extend } from '../common/Util.js';

class MeshShader extends Shader {

    draw(regl, meshes) {
        const props = [];
        let preCommand;
        for (let i = 0, l = meshes.length; i < l; i++) {
            const command = this.getMeshCommand(regl, meshes[i]);

            /*
            //run command one by one, for debug
            const props = extend({}, this.context, meshes[i].getREGLProps());
            command(props);
            */

            if (i === l - 1) {
                props.push(extend({}, this.context, meshes[i].getREGLProps()));
            }
            if (i > 0 && preCommand !== command || i === l - 1) {
                //batch mode
                command(props);
                props.length = 0;
            }
            if (i < l - 1) {
                props.push(extend({}, this.context, meshes[i].getREGLProps()));
                preCommand = command;
            }
        }
        return this;
    }

    getMeshCommand(regl, mesh) {
        const uniforms = Object.keys(mesh.getUniforms(regl));
        const material = mesh.getMaterial();
        let dKey = 'default', defines;
        if (material) {
            dKey = material.getDefinesKey();
            defines = material.getDefines();
        }
        let command = this.commands[dKey];
        if (!command) {
            command = this.commands[dKey] =
                this.createREGLCommand(
                    regl,
                    defines,
                    mesh.getAttributes(regl),
                    uniforms,
                    mesh.getElements(regl)
                );
        }
        return command;
    }
}

export default MeshShader;
