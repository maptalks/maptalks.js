import { vec3, vec4 } from 'gl-matrix';
import { packTangentFrame, buildTangents, buildNormals } from '@maptalks/tbn-packer';
import { isNumber, extend, isArray, isSupportVAO, hasOwn, getBufferSize, isInStride, isInterleaved, getArrayCtor } from './common/Util';
import BoundingBox from './BoundingBox';
import { KEY_DISPOSED } from './common/Constants';
import { getGLTFLoaderBundle } from './common/GLTFBundle'
import { ActiveAttributes, AttributeData, GeometryDesc, NumberArray, TypedArray } from './types/typings';
import REGL from '@maptalks/regl';
import { flatten } from 'earcut';
import { getGPUVertexType, getFormatFromGLTFAccessor, getBytesPerElementFromGLTFAccessor } from './webgpu/common/Types';
import { roundUp } from './webgpu/common/math';

const EMPTY_VAO_BUFFER = [];

const REGL_TYPES = {
    5120: 'int8',
    5122: 'int16',
    5124: 'int32',
    5121: 'uint8',
    5123: 'uint16',
    5125: 'uint32',
    5126: 'float'
};

const REGL_TYPE_WIDTH = {
    5120: 1,
    5122: 2,
    5124: 4,
    5121: 1,
    5123: 2,
    5125: 4,
    5126: 4
};

const DEFAULT_DESC: GeometryDesc = {
    'positionSize': 3,
    'primitive': 'triangles',
    //name of position attribute
    'positionAttribute': 'aPosition',
    'normalAttribute': 'aNormal',
    'uv0Attribute': 'aTexCoord',
    'uv1Attribute': 'aTexCoord1',
    'color0Attribute': 'aColor0',
    'tangentAttribute': 'aTangent',
    'pickingIdAttribute': 'aPickingId',
    'textureCoordMatrixAttribute': 'aTextureCoordMatrix'
};

function getSemantic(desc: GeometryDesc) {
    const semantic = {};
    for (const p in DEFAULT_DESC) {
        if (p.endsWith('Attribute')) {
            semantic[desc[p]] = DEFAULT_DESC[p];
        }
    }
    return semantic;
}

let UID = 1;
function GUID() {
    return UID++;
}

const REF_COUNT_KEY = '_reshader_refCount';

export default class Geometry {

    static createElementBuffer(device: any, elements: any): any {
        if (device.wgpu) {
            if (Array.isArray(elements)) {
                const ctor = findElementConstructor(elements);
                elements = new ctor(elements);
            }
            return createGPUBuffer(device, elements, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, 'index buffer');
        } else {
            // regl
            return device.elements(elements);
        }
    }

    static createBuffer(device: any, data: any, name?: string) {
        if (device.wgpu) {
            return createGPUBuffer(device, data, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, name);
        } else {
            // regl
            return device.buffer(data);
        }
    }

    static padGPUBufferAlignment(array: TypedArray, vertexCount: number): TypedArray {
        const itemBytes = array.byteLength / vertexCount;
        if (itemBytes % 4 === 0) {
            return array;
        }
        const ctor = array.constructor as any;
        const itemSize = array.length / vertexCount;
        const bytesPerElement = itemBytes / itemSize;
        // 无法对齐时，itemSize 一定是1或者3，补位成2或者4就能对齐了

        const newItemSize = ensureAlignment(itemSize, bytesPerElement);
        const newArray = new ctor(newItemSize * vertexCount);
        for (let i = 0; i < vertexCount; i++) {
            for (let ii = 0; ii < itemSize; ii++) {
                newArray[i * newItemSize + ii] = array[i * itemSize + ii];
            }
        }
        return newArray;
    }

    data: Record<string, AttributeData>
    elements: any
    desc: GeometryDesc
    semantic: Record<string, string>
    count: number
    properties: any
    indices: NumberArray
    boundingBox: BoundingBox
    //@internal
    _version: number
    //@internal
    _buffers: Record<string, any>
    //@internal
    _vao: Record<string, any>
    //@internal
    _reglData: Record<string, AttributeData>
    //@internal
    _vertexCount?: number
    //@internal
    _activeAttributes: ActiveAttributes
    //@internal
    _color0Size?: number
    //@internal
    _posDirty?: boolean
    count1?: number
    offset?: number
    //@internal
    _tempPosArray?: NumberArray
    //@internal
    _disposed?: boolean
    //@internal
    _isIndexed?: boolean

    constructor(data: AttributeData, elements, count?: number, desc?: GeometryDesc) {
        this._version = 0;
        this.data = data;

        this.elements = elements;
        this.desc = extend({}, DEFAULT_DESC, desc);
        this.semantic = getSemantic(this.desc);
        const pos = this._getPosAttribute();
        this.data[this.desc.positionAttribute] = pos;
        if (!count) {
            if (this.elements) {
                count = getElementLength(this.elements);
            } else if (pos && pos.length) {
                count = pos.length / this.desc.positionSize;
            } else if (pos && pos.interleavedArray) {
                count = pos.interleavedArray.length / this.desc.positionSize;
            } else if (pos && pos.array) {
                count = pos.array.length / this.desc.positionSize;
            }
        }
        this.count = count;
        if (!this.elements) {
            this.elements = count;
        }
        this._isIndexed = !isNumber(this.elements);
        this.properties = {};
        this._buffers = {};
        this._vao = {};
        this.getVertexCount();
        this._prepareData(true);
        this.updateBoundingBox();
    }

    set version(v: number) {
        throw new Error('Geometry.version is read only.');
    }

    get version() {
        return this._version;
    }

    // set elements(e) {
    //     throw new Error('Geometry.elements is read only, use setElements instead.');
    // }

    //@internal
    _getPosAttribute() {
        return this.data[this.desc.positionAttribute];
    }

    //@internal
    _prepareData(toUpdateRefCount: boolean) {
        if (!this.data) {
            return;
        }

        //TODO 可以直接从POSITION的min/max读出bbox，省去遍历
        const buffers = this._buffers || {};
        for (const attr in this.data) {
            const attribute = this.data[attr];
            if (!attribute) {
                continue;
            }
            if (attribute.buffer && attribute.buffer.destroy) {
                const buffer = attribute.buffer;
                if (!buffer[REF_COUNT_KEY]) {
                    buffer[REF_COUNT_KEY] = 0;
                }
                if (toUpdateRefCount) {
                    buffer[REF_COUNT_KEY]++;
                }
            } else if (attribute && attribute.array) {
                if (isInStride(attribute)) {
                    let id = attribute.array.buffer['__id'];
                    if (!id) {
                        id = attribute.array.buffer['__id'] = GUID();
                    }
                    this.data[attr] = {
                        buffer: id,
                        offset: attribute.byteOffset,
                        stride: attribute.byteStride,
                        type: REGL_TYPES[attribute.componentType],
                        size: attribute.itemSize,
                        count: attribute.count,
                        componentType: attribute.componentType
                    };

                    if (!buffers[id]) {
                        buffers[id] = {
                            data: attribute.array.buffer
                        };
                    }
                } else {
                    this.data[attr] = attribute.array;
                }
            }
        }
        this._buffers = buffers;

        const elements = this.elements;
        if (elements && elements.array) {
            this.elements = elements.array;
        }
    }

    getBuffer(name: string) {
        return this.data[name] && this.data[name].buffer;
    }

    getAttrData(activeAttributes: ActiveAttributes) {
        const key = activeAttributes.key;
        const updated = !this._reglData || !this._reglData[key];
        if (!this._reglData) {
            this._reglData = {};
        }
        if (updated) {
            const reglData = this._reglData[key] = {};
            const data = this.data;
            const { positionAttribute, normalAttribute, uv0Attribute, uv1Attribute, tangentAttribute, color0Attribute, pickingIdAttribute, textureCoordMatrixAttribute } = this.desc;
            extend(reglData, this.data);
            reglData['aPosition'] = data[positionAttribute];
            if (data[normalAttribute]) {
                reglData['aNormal'] = data[normalAttribute];
            }
            if (data[uv0Attribute]) {
                reglData['aTexCoord'] = data[uv0Attribute];
            }
            if (data[uv1Attribute]) {
                reglData['aTexCoord1'] = data[uv1Attribute];
            }
            if (data[tangentAttribute]) {
                reglData['aTangent'] = data[tangentAttribute];
            }
            if (data[color0Attribute]) {
                reglData['aColor0'] = data[color0Attribute];
            }
            if (data[pickingIdAttribute]) {
                reglData['aPickingId'] = data[pickingIdAttribute];
            }
            if (data[textureCoordMatrixAttribute]) {
                reglData['aTextureCoordMatrix'] = data[textureCoordMatrixAttribute];
            }
        }
        return this._reglData[key];
    }

    getREGLData(regl: any, activeAttributes: ActiveAttributes, disableVAO: boolean): AttributeData {
        this.getAttrData(activeAttributes);
        //support vao
        if (isSupportVAO(regl) && !disableVAO) {
            const updated = !this._reglData || !this._reglData[activeAttributes.key];
            const key = activeAttributes && activeAttributes.key || 'default';
            if (!this._vao[key] || updated || this._vao[key].dirty) {
                const reglData = this._reglData[activeAttributes.key];
                const vertexCount = this._vertexCount;
                const buffers = [];

                for (let i = 0; i < activeAttributes.length; i++) {
                    const p = activeAttributes[i];
                    const attr = p.name;
                    const buffer = reglData[attr] && reglData[attr].buffer;
                    if (!buffer || !buffer.destroy) {
                        const data = reglData[attr];
                        if (!data) {
                            if (this.desc.fillEmptyDataInMissingAttribute) {
                                // 某些老版本浏览器（例如3dtiles中的electron），数据不能传空字符串，否则会报错
                                // glDrawElements: attempt to access out of range vertices in attribute 1
                                buffers.push(new Uint8Array(vertexCount * 4));
                            } else {
                                buffers.push(EMPTY_VAO_BUFFER);
                            }
                            continue;
                        }
                        const dimension = (data.data && isArray(data.data) ? data.data.length : data.length) / vertexCount;
                        if (data.data) {
                            data.dimension = dimension;
                            buffers.push(data);
                        } else {
                            buffers.push({
                                data,
                                dimension
                            });
                        }
                    } else if (reglData[attr].stride !== undefined) {
                        buffers.push(
                            reglData[attr]
                        );
                    } else {
                        buffers.push(buffer);
                    }
                }

                const vaoData = {
                    attributes: buffers,
                    primitive: this.getPrimitive()
                } as any;
                if (this.elements && !isNumber(this.elements)) {
                    if (this.elements.destroy) {
                        vaoData.elements = this.elements;
                    } else {
                        vaoData.elements = {
                            primitive: this.getPrimitive(),
                            data: this.elements
                        };
                        const type = this.getElementsType(this.elements);
                        if (type) {
                            vaoData.elements.type = type;
                        }
                    }
                }
                if (!this._vao[key]) {
                    this._vao[key] = {
                        vao: regl.vao(vaoData)
                    };
                } else {
                    this._vao[key].vao(vaoData);
                }
            }
            delete this._vao[key].dirty;
            return this._vao[key];
        }
        return this._reglData[activeAttributes.key];
    }

    //@internal
    _isAttrChanged(activeAttributes: ActiveAttributes): boolean {
        if (activeAttributes === this._activeAttributes) {
            return false;
        }
        if (activeAttributes.length !== this._activeAttributes.length) {
            return true;
        }
        for (let i = 0; i < activeAttributes.length; i++) {
            if (activeAttributes[i] !== this._activeAttributes[i]) {
                return true;
            }
        }
        return false;
    }

    generateBuffers(device: any) {
        const isWebGPU = !!device.wgpu;
        //generate regl buffers beforehand to avoid repeated bufferData
        //提前处理addBuffer插入的arraybuffer
        const allocatedBuffers = this._buffers;
        for (const p in allocatedBuffers) {
            if (!allocatedBuffers[p].buffer) {
                allocatedBuffers[p].buffer = Geometry.createBuffer(device, allocatedBuffers[p].data, p);
            }
            delete allocatedBuffers[p].data;
        }
        const positionName = this.desc.positionAttribute;
        const altitudeName = this.desc.altitudeAttribute;
        const data = this.data;
        const vertexCount = this._vertexCount;
        const buffers = {};
        for (const key in data) {
            if (!data[key]) {
                continue;
            }
            if (Array.isArray(data[key])) {
                data[key] = new Float32Array(data[key] as number[]);
            } else if (isWebGPU && isArray(data[key])) {
                data[key] = Geometry.padGPUBufferAlignment(data[key] as TypedArray, vertexCount);
            }
            //如果调用过addBuffer，buffer有可能是ArrayBuffer
            if (data[key].buffer !== undefined && !(data[key].buffer instanceof ArrayBuffer)) {
                if (data[key].buffer.destroy) {
                    buffers[key] = data[key];
                } else if (allocatedBuffers[data[key].buffer]) {
                    //多个属性共用同一个ArrayBuffer(interleaved)
                    buffers[key] = extend({}, data[key]);
                    buffers[key].buffer = allocatedBuffers[data[key].buffer].buffer;
                }
            } else {
                const arr = data[key].data ? data[key].data : data[key];
                const dimension = arr.length / vertexCount;
                const info = data[key].data ? data[key] : { data: data[key] };
                info.dimension = dimension;
                const buffer = Geometry.createBuffer(device, info, key);
                buffer[REF_COUNT_KEY] = 1;
                buffers[key] = {
                    buffer
                };
                if (key === positionName || key === altitudeName) {//vt中positionSize=2,z存在altitude中，也需要一并保存
                    buffers[key].array = data[key];
                }

            }
            if (this.desc.static || key !== positionName) {//保存POSITION原始数据，用来做额外计算
                delete data[key].array;
            }
        }
        this.data = buffers;
        delete this._reglData;

        // const supportVAO = isSupportVAO(regl);
        // const excludeElementsInVAO = options && options.excludeElementsInVAO;
        if (this.elements && !isNumber(this.elements)) {
            const info = {
                primitive: this.getPrimitive(),
                data: this.elements
            } as any;
            const type = this.getElementsType(this.elements);
            if (type) {
                info.type = type;
            }
            if (!this.desc.static && !this.elements.destroy) {
                const elements = this.elements;
                let ctor;
                if (Array.isArray(this.elements)) {
                    ctor = findElementConstructor(this.elements);
                } else {
                    ctor = this.elements.constructor;
                }
                this.indices = new ctor(elements.length);
                for (let i = 0; i < elements.length; i++) {
                    this.indices[i] = elements[i];
                }
            }
            this.elements = this.elements.destroy ? this.elements : Geometry.createElementBuffer(device, this.elements);
            const elements = this.elements;
            if (!elements[REF_COUNT_KEY]) {
                elements[REF_COUNT_KEY] = 0;
            }
            elements[REF_COUNT_KEY]++;

        }
    }


    getVertexCount(): number {
        const { positionAttribute, positionSize, color0Attribute } = this.desc;
        let data = this.data[positionAttribute];
        if (data.data) {
            data = data.data;
        }
        if (data.array) {
            data = data.array;
        }
        if (isArray(data)) {
            // 因为data可能被转成regl buffer，需要保存到this._vertexCount
            // 在 updateData时再更新
            this._vertexCount = Math.ceil(data.length / positionSize);
        } else if (data && data.count !== undefined) {
            this._vertexCount = data.count;
        }
        const key = color0Attribute;
        if (this.data[key]) {
            const arr = this.data[key].data || this.data[key].array || this.data[key];
            if (Array.isArray(arr)) {
                this._color0Size = arr.length / this._vertexCount;
            } else if (this.data[key].buffer && this.data[key].buffer.destroy) {
                this._color0Size = this.data[key].buffer['_buffer'].dimension;
            } else if (arr && arr.itemSize) {
                this._color0Size = arr.itemSize;
            }
        }
        return this._vertexCount;
    }

    getColor0Size(): number {
        return this._color0Size || 0;
    }

    /**
     * 手动设置geometry的buffer，用于多个属性共用一个ArrayBuffer(interleaved)
     * @param {String} key - 属性
     * @param {ArrayBuffer|REGLBuffer} data - 数据
     */
    // addBuffer(key: string, data: ArrayBuffer | REGL.Buffer): this {
    //     this._buffers[key] = {
    //         data
    //     };
    //     delete this._reglData;
    //     this._deleteVAO();
    //     return this;
    // }

    // updateBuffer(key: string, data: ArrayBuffer | REGL.Buffer): this {
    //     if (!this._buffers[key]) {
    //         throw new Error(`invalid buffer ${key} in geometry`);
    //     }
    //     // this._buffers[key].data = data;
    //     if (this._buffers[key].buffer) {
    //         this._buffers[key].buffer.subdata(data);
    //     } else {
    //         this._buffers[key].data = data;
    //     }
    //     delete this._reglData;
    //     this._deleteVAO();
    //     return this;
    // }

    deleteData(name: string): this {
        const buf = this.data[name];
        if (!buf) {
            return this;
        }
        this._incrVersion();
        if (buf.buffer && buf.buffer.destroy) {
            buf.buffer.destroy();
        }
        delete this.data[name];
        delete this._reglData;
        this._markVAODirty(false);
        return this;
    }

    /**
     * Replace data or refill attribute data buffer
     * @param {String} name - data's name
     * @param {Number[] | Object} data - data to update
     * @returns this
     */
    updateData(name: string, data: AttributeData) {
        const buf = this.data[name];
        if (!buf) {
            return this;
        }
        this._incrVersion();
        let buffer;
        this.data[name] = data;
        if (buf.buffer && buf.buffer.destroy) {
            buffer = buf;
        }
        if (name === this.desc.positionAttribute) {
            this.updateBoundingBox();
        }
        this.getVertexCount();
        if (buffer) {
            if (buffer.buffer.mapState) {
                //webgpu buffer
                buffer.buffer = this._updateGPUBuffer(buffer.buffer, data);
            } else {
                buffer.buffer(data);
            }
            this.data[name] = buffer;
        }
        this._prepareData(false);
        if (this.desc.positionAttribute === name) {
            this._posDirty = true;
        }
        delete this._reglData;
        return this;
    }

    _updateGPUBuffer(buffer: GPUBuffer, data: AttributeData) {
        if (Array.isArray(data)) {
            data = new Float32Array(data);
        }
        const device = (buffer as any).device;
        const size = data.buffer.byteLength;
        if (size > buffer.size) {
            const newBuffer = createGPUBuffer(device, data, buffer.usage, buffer.label);
            delete (buffer as any).device;
            buffer.destroy();
            return newBuffer;
        }
        device.wgpu.queue.writeBuffer(buffer, 0, data.buffer, 0, data.buffer.byteLength);
        return buffer;
    }

    updateSubData(name: string, data: AttributeData, offset: number): this {
        const buf = this.data[name];
        if (!buf) {
            return this;
        }
        this._incrVersion();
        let buffer;
        if (buf.buffer && buf.buffer.destroy) {
            buffer = buf;
        }
        if (name === this.desc.positionAttribute) {
            this._updateSubBoundingBox(data);
        }
        if (buffer) {
            const byteWidth = REGL_TYPE_WIDTH[buffer.buffer['_buffer'].dtype];
            if (data.BYTES_PER_ELEMENT !== byteWidth) {
                const ctor = getTypeCtor(data, byteWidth);
                data = new ctor(data);
            }
            buffer.buffer.subdata(data, offset * byteWidth);
        } else {
            const arr = this.data[name].data ? this.data[name].data : this.data[name];
            for (let i = 0; i < data.length; i++) {
                arr[offset + i] = data[i];
            }
        }
        this._prepareData(false);
        if (this.desc.positionAttribute === name) {
            this._posDirty = true;
        }
        delete this._reglData;
        return this;
    }

    getPrimitive(): REGL.PrimitiveType {
        return this.desc.primitive;
    }

    getElements() {
        return this.elements;
    }

    setElements(elements: any, count: number) {
        if (!elements) {
            throw new Error('elements data is invalid');
        }
        this._incrVersion();
        const e = this.elements;
        this.count = count === undefined ? getElementLength(elements) : count;
        if (elements && elements.destroy) {
            this.elements = elements;
        } else if ((e as any).destroy) {
            if (e.mapState) {
                //webgpu
                if (Array.isArray(elements)) {
                    const ctor = findElementConstructor(elements);
                    elements = new ctor(elements);
                }
                this.elements = this._updateGPUBuffer(e, elements);
            } else {
                this.elements = (e as any)(elements);
            }
        } else {
            this.elements = elements;
        }
        this._markVAODirty(true);
        this._isIndexed = !isNumber(elements);
        return this;
    }

    isIndexedElements() {
        return this._isIndexed;
    }

    deleteElements() {
        if (!this.elements || this.elements.length === 0) {
            return this;
        }
        this._incrVersion();
        if (this.elements && this.elements.destroy && !this.elements[KEY_DISPOSED]) {
            this.elements.destroy();
            this.elements[KEY_DISPOSED] = 1;
        }
        this.elements = [];
        this._markVAODirty(true);
        return this;
    }

    //@internal
    _markVAODirty(forceDelete: boolean) {
        if (this._vao) {
            for (const key in this._vao) {
                if (forceDelete) {
                    this._vao[key].vao.destroy();
                } else {
                    this._vao[key].dirty = true;
                }
            }
            if (forceDelete) {
                this._vao = {};
            }
        }
    }

    setDrawCount(count: number) {
        this._incrVersion();
        this.count1 = count;
        return this;
    }

    getDrawCount() {
        return this.count1 >= 0 ? this.count1 : this.count;
    }

    setDrawOffset(offset: number) {
        this._incrVersion();
        this.offset = offset;
        return this;
    }

    getDrawOffset() {
        return this.offset || 0;
    }

    dispose() {
        this._deleteVAO();
        this._forEachBuffer(buffer => {
            if (!buffer[KEY_DISPOSED]) {
                let refCount = buffer[REF_COUNT_KEY];
                if (refCount) {
                    refCount--;
                }
                if (refCount <= 0) {
                    buffer[KEY_DISPOSED] = true;
                    buffer.destroy();
                } else {
                    buffer[REF_COUNT_KEY] = refCount;
                }
            }
        });
        if (this.properties) {
            // resource saved by highlight.js
            const oldElements = this.properties.oldElementsBeforeHighlight;
            if (oldElements && !oldElements[KEY_DISPOSED]) {
                if (oldElements.destroy) {
                    oldElements.destroy();
                    oldElements[KEY_DISPOSED] = true;
                }
            }
            delete this.properties.oldElementsBeforeHighlight;
            delete this.properties.hasInvisible;
        }
        this.data = {};
        this._buffers = {};
        delete this._reglData;
        this.count = 0;
        this.elements = [];
        delete this._tempPosArray;
        this._disposed = true;
    }

    //@internal
    _deleteVAO() {
        for (const p in this._vao) {
            this._vao[p].vao.destroy();
        }
        this._vao = {};
    }

    isDisposed() {
        return !!this._disposed;
    }

    /**
     * Update boundingBox of Geometry
     */
    updateBoundingBox() {
        let bbox = this.boundingBox;
        if (!bbox) {
            bbox = this.boundingBox = new BoundingBox();
        }
        const posAttr = this.desc.positionAttribute;
        let posArr = this.data[posAttr];
        let posMin: [number, number, number], posMax: [number, number, number];
        if (!isArray(posArr)) {
            // form of object: { usage : 'static', data : [...] }
            if (posArr.data) {
                posArr = posArr.data;
            } else if (isInterleaved(posArr)) {
                posArr = this._getAttributeData(this.desc.positionAttribute);
            } else if (posArr.array) {
                posMin = posArr.min;
                posMax = posArr.max;
                posArr = posArr.array;
            }
        }
        if (posArr && posArr.length) {
            //TODO only support size of 3 now
            const min = bbox.min;
            const max = bbox.max;
            if (posMin && posMax) {
                vec3.set(min, ...posMin);
                vec3.set(max, ...posMax);
            } else {
                vec3.set(min, posArr[0], posArr[1], posArr[2]);
                vec3.set(max, posArr[0], posArr[1], posArr[2]);
                for (let i = 3; i < posArr.length;) {
                    const x = posArr[i++];
                    const y = posArr[i++];
                    const z = posArr[i++];
                    if (x < min[0]) { min[0] = x; }
                    if (y < min[1]) { min[1] = y; }
                    if (z < min[2]) { min[2] = z; }

                    if (x > max[0]) { max[0] = x; }
                    if (y > max[1]) { max[1] = y; }
                    if (z > max[2]) { max[2] = z; }
                }
            }
            bbox.updateVertex();
            bbox.dirty();
        }
    }

    //@internal
    _updateSubBoundingBox(data: NumberArray) {
        const bbox = this.boundingBox;

        const min = bbox.min;
        const max = bbox.max;
        const positionSize = this.desc.positionSize;
        for (let i = 0; i < data.length;) {
            const x = data[i++];
            const y = data[i++];
            let z = 0;
            if (positionSize === 3) {
                z = data[i++];
            }

            if (x < min[0]) { min[0] = x; }
            if (y < min[1]) { min[1] = y; }
            if (z < min[2]) { min[2] = z; }

            if (x > max[0]) { max[0] = x; }
            if (y > max[1]) { max[1] = y; }
            if (z > max[2]) { max[2] = z; }
        }
        bbox.updateVertex();
        bbox.dirty();
    }

    //attribute上结构有2种,对于interleaved结构的数组，可以按需加载，节约内存
    // 1. 数组或者类型数组
    // 2. Object形式（regl的buffer定义）

    //@internal
    _getAttributeData(name: string) {
        const gltf = getGLTFLoaderBundle();
        const data = this.data[name] && this.data[name].array ? this.data[name].array : this.data[name];
        const bufKey = data.buffer;
        if (!isInterleaved(data)) {
            return data;
        } else {
            const attribute = this._buffers[bufKey] ? this._buffers[bufKey].data : data.array;
            const { count, size, stride, offset, componentType } = data;
            const ctor = gltf.GLTFLoader.getTypedArrayCtor(componentType);
            if ((stride === 0 || stride === size * ctor.BYTES_PER_ELEMENT) && offset % ctor.BYTES_PER_ELEMENT === 0) {
                return new ctor(attribute, offset, count * size);
            }
            //对于POSITION数据，为避免updateBBox时频繁创建临时数组，采用缓存tempPosArray的策略获取interleavedArray,
            //对于非POSITION的数据，直接readInterleavedArray读取即可
            if (name === this.desc.positionAttribute) {
                if (!this._tempPosArray || (this._tempPosArray && this._tempPosArray.length < size * count)) {
                    this._tempPosArray = new ctor(size * count);
                    return gltf.GLTFLoader.readInterleavedArray(this._tempPosArray, attribute, count, size, stride, offset, componentType);
                }
                if (!this._posDirty) {
                    return this._tempPosArray;
                }
                this._posDirty = false;
                return gltf.GLTFLoader.readInterleavedArray(this._tempPosArray, attribute, count, size, stride, offset, componentType);
            } else {
                const tempArray = new ctor(size * count);
                return gltf.GLTFLoader.readInterleavedArray(tempArray, attribute, count, size, stride, offset, componentType);
            }
        }
    }

    createTangent(name = 'aTangent', tangentsData?: Float32Array) {
        this._incrVersion();
        //TODO data 可能是含stride的interleaved类型
        const { normalAttribute, positionAttribute, uv0Attribute } = this.desc;
        const normals = this._getAttributeData(normalAttribute);
        const positions = this._getAttributeData(positionAttribute);
        let tangents = tangentsData;
        if (tangentsData && tangentsData instanceof Float32Array) {
            tangents = tangentsData;
        } else {
            tangents = buildTangents(
                positions,
                normals,
                this.data[uv0Attribute],
                this.elements
            );
        }
        const aTangent = this.data[name] = new Float32Array(tangents.length);
        const t: vec4 = [0, 0, 0, 0], n: vec3 = [0, 0, 0], q: vec4 = [0, 0, 0, 0];
        for (let i = 0; i < tangents.length; i += 4) {
            const ni = i / 4 * 3;
            vec3.set(n, normals[ni], normals[ni + 1], normals[ni + 2]);
            vec4.set(t, tangents[i], tangents[i + 1], tangents[i + 2], tangents[i + 3]);
            packTangentFrame(q, n, t);
            vec4.copy(aTangent.subarray(i, i + 4), q);
        }
        delete this._reglData;
    }

    createNormal(name = 'aNormal') {
        this._incrVersion();
        //TODO data 可能是含stride的interleaved类型
        const pos = this._getAttributeData(this.desc.positionAttribute);
        this.data[name] = buildNormals(pos.array || pos, this.elements);
        delete this._reglData;
    }

    /**
     * Create barycentric attribute data
     * @param {String} name - attribute name for barycentric attribute
     */
    createBarycentric(name = 'aBarycentric') {
        if (this.desc.primitive !== 'triangles') {
            throw new Error('Primitive must be triangles to create bary centric data');
        }
        this._incrVersion();
        const bary = new Uint8Array(this._vertexCount * 3);
        for (let i = 0, l = this.elements.length; i < l;) {
            for (let j = 0; j < 3; j++) {
                const ii = this.elements[i++];
                bary[ii * 3 + j] = 1;
            }
        }
        this.data[name] = bary;
        delete this._reglData;
    }

    /**
     * Build unique vertex data for each attribute
     */
    buildUniqueVertex() {
        this._incrVersion();
        const data = this.data;
        const indices = this.elements;
        if (!isArray(indices)) {
            throw new Error('elements must be array to build unique vertex.');
        }

        const keys = Object.keys(data);
        const oldData = {};

        let pos = data[this.desc.positionAttribute];
        pos = pos.length ? pos : pos.array; //存在两种结构 array或者 { array }
        if (!isArray(pos)) {
            throw new Error(this.desc.positionAttribute + ' must be array to build unique vertex.');
        }
        const vertexCount = this._vertexCount;

        const l = indices.length;
        for (let i = 0; i < keys.length; i++) {
            const name = keys[i];
            const attr = isArray(data[name]) ? data[name] : data[name].array;//存在两种结构 array或者 { array }
            const size = attr.length / vertexCount;
            if (!isArray(attr)) {
                throw new Error(name + ' must be array to build unique vertex.');
            }
            oldData[name] = attr;
            const ctor = getArrayCtor(attr);
            data[name] = new ctor(l * size);
        }

        let cursor = 0;
        for (let i = 0; i < l; i++) {
            const idx = indices[i];
            for (let ii = 0; ii < keys.length; ii++) {
                const name = keys[ii];
                const array = data[name];
                const size = oldData[name].length / vertexCount;

                for (let k = 0; k < size; k++) {
                    array[cursor * size + k] = oldData[name][idx * size + k];
                }
            }
            indices[i] = cursor++;
        }
        pos = this.data[this.desc.positionAttribute];
        this._vertexCount = Math.ceil(pos.length / this.desc.positionSize);
        delete this._reglData;
    }

    getMemorySize() {
        let size = 0;
        for (const p in this.data) {
            if (hasOwn(this.data, p)) {
                size += getBufferSize(this.data[p]);
            }
        }
        if (this.elements) {
            const elements = this.elements;
            if (elements.destroy) {
                if (elements['_elements']) {
                    //regl
                    size += elements['_elements'].buffer.byteLength;
                } else {
                    size += elements.size;
                }
            } else if (elements.BYTES_PER_ELEMENT) {
                size += elements.length * elements.BYTES_PER_ELEMENT;
            } else if (elements.length) {
                // uint32 in default
                size += elements.length * 4;
            }
        }
        return size;
    }

    //@internal
    _forEachBuffer(fn: (buffer: any) => void) {
        if (this.elements && this.elements.destroy) {
            fn(this.elements);
        }
        for (const p in this.data) {
            if (hasOwn(this.data, p)) {
                if (this.data[p] && this.data[p].buffer && this.data[p].buffer.destroy) {
                    fn(this.data[p].buffer);
                }
            }
        }

        for (const p in this._buffers) {
            if (hasOwn(this._buffers, p)) {
                if (this._buffers[p] && this._buffers[p].buffer && this._buffers[p].buffer.destroy) {
                    fn(this._buffers[p].buffer);
                }
            }
        }
    }

    getElementsType(elements: NumberArray) {
        if (elements instanceof Uint8Array) {
            return 'uint8';
        } else if (elements instanceof Uint16Array) {
            return 'uint16';
        } else if (elements instanceof Uint32Array) {
            return 'uint32';
        } else {
            return undefined;
        }
    }

    //@internal
    _incrVersion() {
        this._version++;
    }

    getCommandKey(device: any) {
        if (device && device.wgpu) {
            // 因为attribute组织方式会影响pipeline的创建，所以attributes组织方式不同时，需要创建不同的command key
            // 我们这里暂时不考虑Geometry会更新attributes组织方式的情况，因为在maptalks的使用场景不会出现
            // 可能有些attribute没有被wgsl使用，但组织方式不同，这里也不考虑这种情况
            const keys = [];
            for (const p in this.data) {
                const attr = this.data[p];
                if (attr.byteStride) {
                    keys.push(`${p}(${attr.byteOffset}/${attr.byteStride}})`);
                } else {
                    keys.push(p);
                }
            }
            return keys.sort().join('-');
        } else {
            // regl
            return '';
        }
    }

    getBufferDescriptor(vertexInfo) {
        const attrInfos = [];
        for (const p in vertexInfo) {
            const info = vertexInfo[p];
            attrInfos[info.location] = info;
        }
        const data = this.data;
        const bufferDesc = [];
        const bufferMapping = {};
        // bufferDesc的顺序需要和wgsl中的location对应
        for (let i = 0; i < attrInfos.length; i++) {
            if (!attrInfos[i]) {
                continue;
            }
            const p = attrInfos[i].geoAttrName;
            const attr = data[p];
            if (!attr) {
                continue;
            }
            const infoName = this.semantic[p] || p;
            const info = vertexInfo[infoName];
            if (!info) {
                continue;
            }
            const accessorName = attr.accessorName;
            const byteStride = attr.byteStride;
            if (byteStride && accessorName) {
                // a GLTF accessor style attribute
                const format = getFormatFromGLTFAccessor(attr.componentType, attr.itemSize);
                let desc = bufferMapping[accessorName];
                if (desc) {
                    desc.attributes.push({
                        shaderLocation: info.location,
                        format,
                        offset: attr.byteOffset
                    });
                } else {
                    desc = {
                        arrayStride: byteStride,
                        attributes: [
                            {
                                shaderLocation: info.location,
                                format,
                                offset: attr.byteOffset
                            }
                        ]
                    }
                    bufferMapping[accessorName] = desc;
                    bufferDesc[i] = desc;
                }
            } else {
                const desc = getAttrBufferDescriptor(attr, info);
                bufferDesc[i] = desc;
            }
        }
        return bufferDesc;
    }
}

function getElementLength(elements) {
    if (isNumber(elements)) {
        return elements;
    } else if (elements.count !== undefined) {
        // object buffer form
        return elements.count;
    } else if (elements.destroy) {
        if (elements['_elements']) {
            // a regl element buffer
            return elements['_elements'].vertCount;
        } else {
            //GPUBuffer
            return elements.itemCount;
        }
    } else if (elements.length !== undefined) {
        return elements.length;
    } else if (elements.data) {
        return elements.data.length;
    }
    throw new Error('invalid elements length');
}

function getTypeCtor(arr: NumberArray, byteWidth: number) {
    if (arr instanceof Uint8Array || arr instanceof Uint16Array || arr instanceof Uint32Array || arr instanceof Uint8ClampedArray) {
        return byteWidth === 1 ? Uint8Array : byteWidth === 2 ? Uint16Array : Uint32Array;
    }
    if (arr instanceof Int8Array || arr instanceof Int16Array || arr instanceof Int32Array) {
        return byteWidth === 1 ? Int8Array : byteWidth === 2 ? Int16Array : Int32Array;
    }
    if (arr instanceof Float32Array || arr instanceof Float64Array) {
        return byteWidth === 4 ? Float32Array : Float64Array;
    }
    return null;
}

export function getAttrBufferDescriptor(attr, info): GPUVertexBufferLayout {
    const array = attr.data || attr.array || attr;
    let itemSize = info.itemSize;

    if (attr.buffer && !isArray(attr)) {
        const bytesPerElement = attr.buffer.bytesPerElement;
        itemSize = ensureAlignment(itemSize, bytesPerElement);
        const format = getItemFormat(attr, itemSize);
        return {
            arrayStride: itemSize * bytesPerElement,
            attributes: [
                {
                    shaderLocation: info.location,
                    format,
                    offset: 0
                }
            ]
        };
    } else if (isArray(array)) {
        let format, bytesPerElement;
        if (attr.componentType) {
            format = getFormatFromGLTFAccessor(attr.componentType, attr.itemSize);
            bytesPerElement = getBytesPerElementFromGLTFAccessor(attr.componentType);
        } else {
            format = getItemFormat(array, itemSize);
            bytesPerElement = getBytesPerElement(array);
        }
        itemSize = ensureAlignment(itemSize, bytesPerElement);
        return {
            arrayStride: itemSize * bytesPerElement,
            attributes: [
                {
                    shaderLocation: info.location,
                    format,
                    offset: 0
                }
            ]
        };
    }
}

function getBytesPerElement(data) {
    const array = getAttrArray(data);
    if (array.destroy) {
        return array.bytesPerElement;
    }
    if (array.BYTES_PER_ELEMENT) {
        return array.BYTES_PER_ELEMENT;
    } else if (Array.isArray(array)) {
        // float
        return 4;
    } else {
        const item = array;
        const gltf = getGLTFLoaderBundle();
        const ctor = gltf.GLTFLoader.getTypedArrayCtor(item.componentType);
        return ctor.BYTES_PER_ELEMENT;
    }
}

function getItemFormat(data, itemSize) {
    const array = getAttrArray(data);
    let format;
    if (array.destroy) {
        format = array.itemType;
    } else {
        format = getGPUVertexType(array);
    }
    return itemSize > 1 ? (format + 'x' + itemSize) : format;
}

function getAttrArray(data) {
    return data.data || (data.buffer.destroy && data.buffer) || data;
}

function createGPUBuffer(device, data, usage, label) {
    data = data.data || data;
    if (Array.isArray(data[0])) {
        data = flatten(data);
    }
    if (Array.isArray(data)) {
        data = new Float32Array(data);
    }
    const ctor = data.constructor;
    // f32 in default
    const byteLength = data.byteLength;
    // mappedAtCreation requires size is a multiplier of 4
    // https://github.com/gpuweb/gpuweb/issues/5105
    const size = roundUp(byteLength, 4);
    const buffer = device.wgpu.createBuffer({
        label,
        size,
        usage,
        mappedAtCreation: true
    });
    buffer.device = device;
    new ctor(buffer.getMappedRange()).set(data);
    buffer.unmap();
    buffer.itemCount = data.length;
    buffer.itemType = getGPUVertexType(data); // uint8, sint8, uint16, sint16, uint32, sint32, float32
    buffer.bytesPerElement = getBytesPerElement(data);
    return buffer;
}
function findElementConstructor(data: number[]): any {
    let max = -Infinity;
    for (let i = 0; i < data.length; i++) {
        if (data[i] > max) {
            max = data[i];
        }
    }
    return getIndexArrayType(max);
}

function getIndexArrayType(max) {
    if (max < 65536) return Uint16Array;
    return Uint32Array;
}
function ensureAlignment(itemSize: number, bytesPerElement: number): any {
    const itemBytes = itemSize * bytesPerElement;
    if (itemBytes % 4 === 0) {
        return itemSize;
    }
    return itemSize + (4 - (itemBytes % 4)) / bytesPerElement;
}

