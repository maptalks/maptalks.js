import { extend } from './common/Util.js';
import Mesh from './Mesh.js';
import { KEY_DISPOSED } from './common/Constants';

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

    getDefines() {
        const defines = super.getDefines();
        defines['HAS_INSTANCE'] = 1;
        return defines;
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
            const bytesPerElement = this._getBytesPerElement(buffer.buffer._buffer.dtype);
            const len = buffer.buffer._buffer.byteLength / bytesPerElement;
            if (len >= data.length && bytesPerElement >= (data.BYTES_PER_ELEMENT || 0)) {
                buffer.buffer.subdata(data);
            } else {
                buffer.buffer(data);
            }
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
            } else if (data[key].destroy) {
                buffers[key] = {
                    buffer : data[key],
                    divisor: 1
                };
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

    disposeInstanceData() {
        const buffers = this.instancedData;
        if (buffers) {
            for (const p in buffers) {
                if (buffers[p] && buffers[p].destroy && !buffers[p][KEY_DISPOSED]) {
                    buffers[p][KEY_DISPOSED] = 1;
                    buffers[p].destroy();
                }
            }
        }
        delete this.instancedData;
    }

    _getBytesPerElement(dtype) {
        switch (dtype) {
        case 0x1400:
            return 1;
        case 0x1401:
            return 1;
        case 0x1402:
            return 2;
        case 0x1403:
            return 2;
        case 0x1404:
            return 4;
        case 0x1405:
            return 4;
        case 0x1406:
            return 4;
        }
        throw new Error('unsupported data type: ' + dtype);
    }
}
