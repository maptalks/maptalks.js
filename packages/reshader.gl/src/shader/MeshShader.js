import Shader from './Shader.js';
import { isNumber } from '../common/Util.js';
import InstancedMesh from '../InstancedMesh.js';

class MeshShader extends Shader {

    draw(regl, meshes) {
        const props = [];
        let preCommand;
        for (let i = 0, l = meshes.length; i < l; i++) {
            if (!meshes[i].isValid()) {
                if (i === l - 1 && preCommand && props.length) {
                    preCommand(props);
                }
                continue;
            }
            if (!meshes[i].geometry.getDrawCount() || !this.filter(meshes[i])) {
                //此处regl有个潜在的bug:
                //如果count为0的geometry不过滤掉，regl生成的函数中，bind的texture不会执行unbind
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
            const meshProps = meshes[i].getREGLProps(regl);
            this.appendRenderUniforms(meshProps);
            props.push(meshProps);
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
        let dKey = mesh.getDefinesKey();
        const defines = mesh.getDefines();
        const elementType = isNumber(mesh.getElements()) ? 'count' : 'elements';
        dKey += '_' + elementType;
        if (mesh instanceof InstancedMesh) {
            dKey += '_instanced';
        }
        let command = this.commands[dKey];
        if (!command) {
            const uniforms = Object.keys(mesh.getUniforms(regl));
            command = this.commands[dKey] =
                this.createREGLCommand(
                    regl,
                    defines,
                    mesh.getAttributes(),
                    uniforms,
                    mesh.getElements(),
                    mesh instanceof InstancedMesh
                );
        }
        return command;
    }
}

export default MeshShader;
