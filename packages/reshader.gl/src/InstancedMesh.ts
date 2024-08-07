import { extend, isSupportVAO, getBufferSize, hasOwn } from './common/Util.js';
import Mesh from './Mesh.js';
import { KEY_DISPOSED } from './common/Constants';
import REGL, { BufferOptions, Regl } from '@maptalks/regl';
import { ActiveAttributes, AttributeBufferData, InstancedAttribute, MeshOptions, NumberArray } from './types/typings';
import Material from './Material';
import Geometry from './Geometry';

export default class InstancedMesh extends Mesh {
    //@internal
    _instanceCount: number
    instancedData: InstancedAttribute
    //@internal
    _vao: Record<string, any>

    constructor(instancedData: InstancedAttribute, instanceCount: number, geometry: Geometry, material?: Material, config: MeshOptions = {}) {
        super(geometry, material, config);
        this._instanceCount = instanceCount;
        this.instancedData = instancedData || {};
        this._checkInstancedProp();
        this._vao = {};
    }

    get instanceCount() {
        return this._instanceCount;
    }

    set instanceCount(count) {
        this._incrVersion();
        this._instanceCount = count;
    }

    getMemorySize() {
        // TODO 需要确认是否是 mesh.memorySize * instanceCount
        return super.getMemorySize() + this._getInstanceMemorySize();
    }

    //@internal
    _getInstanceMemorySize() {
        let size = 0;
        for (const p in this.instancedData) {
            if (hasOwn(this.instancedData, p)) {
                size += getBufferSize(this.instancedData[p]);
            }
        }
        return size;
    }

    //@internal
    _checkInstancedProp() {
        for (const p in this.instancedData) {
            if (this.geometry.data[p]) {
                throw new Error(`Duplicate attribute ${p} defined in geometry and instanced data`);
            }
        }
    }

    //@internal
    _getREGLAttrData(regl: Regl, activeAttributes: ActiveAttributes) {
        // 只需要获得 geometry的 attr 数据，不需要elements
        const geoBuffers = this.geometry.getAttrData(activeAttributes);
        if (isSupportVAO(regl)) {
            const key = activeAttributes.key;
            if (!this._vao[key] || this._vao[key].dirty) {
                const attributes = activeAttributes.map(attr => attr.name);
                const buffers = [];
                for (let i = 0; i < attributes.length; i++) {
                    const data = geoBuffers[attributes[i]];
                    const buffer = data && data.buffer || this.instancedData[attributes[i]];
                    buffers.push(buffer);
                }
                const vaoData = {
                    attributes: buffers,
                    primitive: this.geometry.getPrimitive()
                };
                // const elements = this.geometry.getElements();
                // if (elements && !isNumber(elements)) {
                //     vaoData.elements = {
                //         primitive: this.geometry.getPrimitive(),
                //         data: elements
                //     };
                //     const type = this.geometry.getElementsType(elements);
                //     if (type) {
                //         vaoData.elements.type = type;
                //     }
                // }
                // console.log(vaoData);
                if (this._vao[key]) {
                    this._vao[key].vao(vaoData);
                } else {
                    this._vao[key] = {
                        vao: regl.vao(vaoData)
                    };
                }
                delete this._vao[key].dirty;
            }
            return this._vao[key];
        } else {
            return geoBuffers;
        }

    }

    getDefines() {
        const defines = super.getDefines();
        defines['HAS_INSTANCE'] = 1;
        return defines;
    }

    getCommandKey(regl: Regl) {
        return 'i_' + super.getCommandKey(regl);
    }

    //因为 updateBoundingBox 需要， 不再自动生成buffer，而是把原有的buffer销毁
    //调用 updateInstancedData 后，需要调用 updateBoundingBox 更新bbox, 再调用 generateInstancedBuffers 来重新生成 buffer
    updateInstancedData(name: string, data) {
        const buf = this.instancedData[name] as AttributeBufferData;
        if (!buf) {
            return this;
        }
        this._incrVersion();
        // let buffer;
        this.instancedData[name] = data;
        if (buf.buffer && buf.buffer.destroy) {
            buf.buffer.destroy();
        }
        // if (buffer) {
        //     const bytesPerElement = this._getBytesPerElement(buffer.buffer._buffer.dtype);
        //     const len = buffer.buffer._buffer.byteLength / bytesPerElement;
        //     if (len >= data.length && bytesPerElement >= (data.BYTES_PER_ELEMENT || 0)) {
        //         buffer.buffer.subdata(data);
        //     } else {
        //         buffer.buffer(data);
        //     }
        //     this.instancedData[name] = buffer;
        // }
        if (this._vao) {
            for (const key in this._vao) {
                this._vao[key].dirty = true;
            }
        }
        return this;
    }

    generateInstancedBuffers(regl: Regl) {
        const data = this.instancedData;
        const buffers: Record<string, AttributeBufferData> = {};
        for (const key in data) {
            if (!data[key]) {
                continue;
            }
            const attrBuf = (data[key] as AttributeBufferData);
            if (attrBuf.buffer !== undefined && attrBuf.buffer.destroy) {
                buffers[key] = attrBuf;
                if (buffers[key].divisor) {
                    buffers[key].divisor = 1;
                }
            } else if ((data[key] as REGL.Buffer).destroy) {
                buffers[key] = {
                    buffer : data[key] as REGL.Buffer,
                    divisor: 1
                };
            } else {
                buffers[key] = {
                    buffer: regl.buffer({
                        data: data[key],
                        dimension: (data[key] as NumberArray).length / this._instanceCount
                    } as BufferOptions),
                    divisor: 1
                };
            }
        }
        this.instancedData = buffers;
        return this;
    }

    getREGLProps(regl: Regl, activeAttributes: ActiveAttributes) {
        const props = super.getREGLProps(regl, activeAttributes);
        if (!isSupportVAO(regl)) {
            extend(props, this.instancedData);
        }
        props.elements = this.geometry.getElements();
        props.instances = this._instanceCount;
        return props;
    }

    disposeInstancedData() {
        const buffers = this.instancedData;
        if (buffers) {
            for (const p in buffers) {
                if (!buffers[p]) {
                    continue;
                }
                const buffer = (buffers[p] as REGL.Buffer).destroy ? buffers[p] as REGL.Buffer : (buffers[p] as AttributeBufferData).buffer;
                if (buffer.destroy && !buffer[KEY_DISPOSED]) {
                    buffer[KEY_DISPOSED] = 1;
                    buffer.destroy();
                }
            }
        }
        this.instancedData = {};
        for (const p in this._vao) {
            this._vao[p].vao.destroy();
        }
        this._vao = {};
    }

    // getBoundingBox() {
    //     if (!this._bbox) {
    //         this.updateBoundingBox();
    //     }
    //     return this._bbox;
    // }
    // /* eslint-disable camelcase */
    // updateBoundingBox() {
    //     const {  instance_vectorA, instance_vectorB, instance_vectorC } = this.instancedData;
    //     if (!instance_vectorA || !instance_vectorB || !instance_vectorC) {
    //         return super.updateBoundingBox();
    //     }
    //     if (!this._bbox) {
    //         this._bbox = [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]];
    //     }
    //     const box = this.geometry.boundingBox;
    //     const { min, max } = box;
    //     for (let i = 0; i < instance_vectorA.length; i += 4) {
    //         mat4.set(MAT4,
    //             instance_vectorA[i + 0], instance_vectorB[i + 0], instance_vectorC[i + 0], 0,
    //             instance_vectorA[i + 1], instance_vectorB[i + 1], instance_vectorC[i + 1], 0,
    //             instance_vectorA[i + 2], instance_vectorB[i + 2], instance_vectorC[i + 2], 0,
    //             instance_vectorA[i + 3], instance_vectorB[i + 3], instance_vectorC[i + 3], 1
    //         );
    //         mat4.multiply(MAT4, MAT4, this.positionMatrix);
    //         const matrix = mat4.multiply(MAT4, this.localTransform, MAT4);
    //         vec4.set(MIN4, min[0], min[1], min[2], 1);
    //         vec4.set(MAX4, max[0], max[1], max[2], 1);
    //         vec4.transformMat4(MIN4, MIN4, matrix);
    //         vec4.transformMat4(MAX4, MAX4, matrix);
    //         this._bbox[0][0] = Math.min(this._bbox[0][0], MIN4[0]);
    //         this._bbox[0][1] = Math.min(this._bbox[0][1], MIN4[1]);
    //         this._bbox[0][2] = Math.min(this._bbox[0][2], MIN4[2]);

    //         this._bbox[1][0] = Math.max(this._bbox[1][0], MIN4[0]);
    //         this._bbox[1][1] = Math.max(this._bbox[1][1], MIN4[1]);
    //         this._bbox[1][2] = Math.max(this._bbox[1][2], MIN4[2]);
    //     }
    //     return this._bbox;
    // }
    /* eslint-enable camelcase */

    // _getBytesPerElement(dtype: number) {
    //     switch (dtype) {
    //     case 0x1400:
    //         return 1;
    //     case 0x1401:
    //         return 1;
    //     case 0x1402:
    //         return 2;
    //     case 0x1403:
    //         return 2;
    //     case 0x1404:
    //         return 4;
    //     case 0x1405:
    //         return 4;
    //     case 0x1406:
    //         return 4;
    //     }
    //     throw new Error('unsupported data type: ' + dtype);
    // }
}
