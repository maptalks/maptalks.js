import Shader from './Shader';

class MeshShader extends Shader {

    draw(device, meshes) {
        if (!meshes || !meshes.length) {
            return 0;
        }
        const props = [];
        let count = 0;
        let preCommand;
        for (let i = 0, l = meshes.length; i < l; i++) {
            if (!meshes[i].isValid()) {
                if (i === l - 1 && preCommand && props.length) {
                    this.run(device, preCommand, props);
                }
                continue;
            }
            //尽可能的不要用get 方法，性能损失较大
            const geometry = meshes[i]._geometry;
            if (!geometry.getDrawCount() || !this._runFilter(meshes[i])) {
                //此处device有个潜在的bug:
                //如果count为0的geometry不过滤掉，device生成的函数中，bind的texture不会执行unbind
                if (i === l - 1 && preCommand && props.length) {
                    this.run(device, preCommand, props);
                }
                continue;
            }

            const v = meshes[i].getRenderProps(device);
            this._ensureContextDefines(v);
            v.shaderContext = this.context;
            v.meshObject = meshes[i];
            this.appendDescUniforms(device, v);

            const command = this.getMeshCommand(device, meshes[i], v);
            meshes[i].appendGeoAttributes(v, device, command.activeAttributes);

            //run command one by one, for debug
            // const props = extend({}, this.context, meshes[i].getRenderProps());
            // console.log(i);
            // command(props);

            if (props.length && preCommand !== command) {
                //batch mode
                this.run(device, preCommand, props);
                props.length = 0;
            }

            props.push(v);
            count++;

            if (i < l - 1) {
                preCommand = command;
            } else if (i === l - 1) {
                this.run(device, command, props);
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

    getMeshCommand(device, mesh, renderProps) {
        if (!this._cmdKeys) {
            this._cmdKeys = {};
        }
        const material = mesh.getMaterial();
        let doubleSided = false;
        if (material) {
            doubleSided = material.doubleSided;
        }
        const key = this.getShaderCommandKey(device, mesh, renderProps);
        let storedKeys = this._cmdKeys[key];
        if (!storedKeys) {
            storedKeys = this._cmdKeys[key] = {};
        }
        const meshKey = mesh.getCommandKey(device);
        if (!storedKeys[meshKey]) {
            storedKeys[meshKey] = key + '_' + meshKey;
        }
        const dKey = storedKeys[meshKey];
        // const key = this.dkey || '';
        // const dKey = key + '_' + mesh.getCommandKey();
        let command = this.commands[dKey];
        if (!command) {


            const commandProps = {};
            if (doubleSided && this.extraCommandProps) {
                commandProps.cull = { enable: false };
            }
            command = this.commands[dKey] = this.createMeshCommand(device, mesh, commandProps, renderProps);
        }
        return command;
    }
}

export default MeshShader;
