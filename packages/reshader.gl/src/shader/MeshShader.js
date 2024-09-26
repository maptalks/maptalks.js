import Shader from './Shader.js';
import InstancedMesh from '../InstancedMesh.js';

class MeshShader extends Shader {

    draw(regl, meshes) {
        if (!meshes || !meshes.length) {
            return 0;
        }
        const props = [];
        let count = 0;
        let preCommand;
        for (let i = 0, l = meshes.length; i < l; i++) {
            if (!meshes[i].isValid()) {
                if (i === l - 1 && preCommand && props.length) {
                    preCommand(props);
                }
                continue;
            }
            if (!meshes[i].geometry.getDrawCount() || !this._runFilter(meshes[i])) {
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

            const v = meshes[i].getREGLProps(regl, command.activeAttributes);
            this._ensureContextDefines(v);
            v.shaderContext = this.context;
            this.appendDescUniforms(regl, v);
            props.push(v);
            count++;

            if (i < l - 1) {
                preCommand = command;
            } else if (i === l - 1) {
                command(props);
            }
        }
        return count;
    }

    _ensureContextDefines(v) {
        if (!this.context) {
            return;
        }
        if (!v.contextKeys) {
            v.contextKeys = {};
        }
        if (v.contextKeys[this.uid] === this.contextKeys) {
            return;
        }
        for (const p in this.context) {
            if (p !== 'framebuffer' && !Object.getOwnPropertyDescriptor(v, p)) {
                Object.defineProperty(v, p, {
                    configurable: false,
                    enumerable: true,
                    get: function () {
                        return this.shaderContext[p];
                    }
                });
            }
        }

        if (!Object.getOwnPropertyDescriptor(v, 'framebuffer')) {
            Object.defineProperty(v, 'framebuffer', {
                configurable: false,
                enumerable: true,
                get: function () {
                    return this['targetFramebuffer'] || this.shaderContext && this.shaderContext['framebuffer'];
                }
            });
        }

        v.contextKeys[this.uid] = this.contextKeys;
    }

    // filter() {
    //     return true;
    // }

    _runFilter(m) {
        const filters = this.filter;
        if (!filters) {
            return true;
        }
        if (Array.isArray(filters)) {
            for (let i = 0; i < filters.length; i++) {
                if (!filters[i](m)) {
                    return false;
                }
            }
            return true;
        }
        return filters(m);
    }

    getMeshCommand(regl, mesh) {
        if (!this._cmdKeys) {
            this._cmdKeys = {};
        }
        const key = this.dkey || 'default';
        let storedKeys = this._cmdKeys[key];
        if (!storedKeys) {
            storedKeys = this._cmdKeys[key] = {};
        }
        const meshKey = mesh.getCommandKey(regl);
        if (!storedKeys[meshKey]) {
            storedKeys[meshKey] = key + '_' + mesh.getCommandKey(regl);
        }
        const dKey = storedKeys[meshKey];
        // const key = this.dkey || '';
        // const dKey = key + '_' + mesh.getCommandKey(regl);
        let command = this.commands[dKey];
        if (!command) {
            const defines = mesh.getDefines();
            const material = mesh.getMaterial();
            const commandProps = {};
            if (material) {
                const doubleSided = material.doubleSided;
                if (doubleSided && this.extraCommandProps) {
                    commandProps.cull = { enable: false };
                }
            }
            command = this.commands[dKey] =
                this.createREGLCommand(
                    regl,
                    defines,
                    mesh.getElements(),
                    mesh instanceof InstancedMesh,
                    mesh.disableVAO,
                    commandProps
                );
        }
        return command;
    }
}

export default MeshShader;
