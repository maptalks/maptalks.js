import { extend } from './common/Util.js';
import Mesh from './Mesh.js';

export default class InstancedMesh extends Mesh {
    constructor(instancedData, instanceCount, geometry, material, config = {}) {
        super(geometry, material, config);
        this.instanceCount = instanceCount;
        this.instancedData = instancedData || {};
        this._checkInstancedProp();
    }

    _checkInstancedProp() {
        for (const p in this.instancedData) {
            if (this.geometry.data[p]) {
                throw new Error(`Duplicate attribute ${p} defined in geometry and instanced data`);
            }
        }
    }

    getAttributes() {
        const attributes = super.getAttributes();
        for (const p in this.instancedData) {
            attributes.push(p);
        }
        return attributes;
    }

    updateInstancedData(name, data) {
        const buf = this.instancedData[name];
        if (!buf) {
            return this;
        }
        let buffer;
        this.instancedData[name] = data;
        if (buf.buffer && buf.buffer.destroy) {
            buffer = buf;
        }
        if (buffer) {
            buffer.buffer.subdata(data);
            this.instancedData[name] = buffer;
        }
        return this;
    }

    generateInstancedBuffers(regl) {
        const data = this.instancedData;
        const buffers = {};
        for (const key in data) {
            if (!data[key]) {
                continue;
            }
            if (data[key].buffer !== undefined && data[key].buffer.destroy) {
                buffers[key] = data[key];
                if (buffers[key].divisor) {
                    buffers[key].divisor = 1;
                }
            } else {
                buffers[key] = {
                    buffer : regl.buffer(data[key]),
                    divisor: 1
                };
            }
        }
        this.instancedData = buffers;
        return this;
    }

    getREGLProps(regl) {
        const props = super.getREGLProps(regl);
        extend(props, this.instancedData);
        props.instances = this.instanceCount;
        return props;
    }
}
