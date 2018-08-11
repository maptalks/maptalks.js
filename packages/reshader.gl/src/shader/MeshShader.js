import Shader from './Shader.js';
import { extend, isNumber } from '../common/Util.js';

class MeshShader extends Shader {

    draw(regl, meshes) {
        const props = [];
        let preCommand;
        for (let i = 0, l = meshes.length; i < l; i++) {
            if (!this.filter(meshes[i])) {
                if (i === l - 1 && preCommand && props.length) {
                    preCommand(props);
                }
                continue;
            }
            const command = this.getMeshCommand(regl, meshes[i]);

            //run command one by one, for debug
            // const props = extend({}, this.context, meshes[i].getREGLProps());
            // console.log(i);
            // command(props);

            if (props.length && preCommand !== command) {
                //batch mode
                preCommand(props);
                props.length = 0;
            }
            const meshProps = meshes[i].getREGLProps();
            props.push(extend({}, this.getUniforms(meshProps), meshProps));
            if (i < l - 1) {
                preCommand = command;
            } else if (i === l - 1) {
                command(props);
            }
        }
        return this;
    }

    filter() {
        return true;
    }

    getMeshCommand(regl, mesh) {
        const uniforms = Object.keys(mesh.getUniforms(regl));
        let dKey = mesh.getDefinesKey();
        const defines = mesh.getDefines();
        const elementType = isNumber(mesh.getElements()) ? 'count' : 'elements';
        dKey += '_' + elementType;
        let command = this.commands[dKey];
        if (!command) {
            command = this.commands[dKey] =
                this.createREGLCommand(
                    regl,
                    defines,
                    mesh.getAttributes(),
                    uniforms,
                    mesh.getElements()
                );
        }
        return command;
    }
}

export default MeshShader;
