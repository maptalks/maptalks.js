import Ajax from './Ajax';
import { getTypedArrayCtor, isDataUri, dataUriToArrayBuffer, readInterleavedArray, bufferToString } from '../common/Util';
import { vec4 } from 'gl-matrix';

const TYPES = ['SCALAR', 1, 'VEC2', 2, 'VEC3', 3, 'VEC4', 4, 'MAT2', 4, 'MAT3', 9, 'MAT4', 16];
const TEMP_VEC4 = [];

export default class Accessor {

    constructor(rootPath, gltf, glbBuffer, fetchOptions, urlModifier) {
        this.rootPath = rootPath;
        this.gltf = gltf;
        // const meshes = gltf.meshes;
        // let count;
        // if (Array.isArray(meshes)) {
        //     count = meshes.length;
        // } else {
        //     count = Object.keys(meshes).length;
        // }
        // 永远不开启interleave，原因：
        // 1. 如果一个gltf文件中有多个mesh共享一个buffer，每个对应的reshader.Geometry中都会对同一个buffer创建一个reglBuffer
        // 2. 要实现多个reshader.Mesh共享reglBuffer，逻辑过于复杂
        // 3. 3dtiles的Composite模型中，存在多个gltf共享一个buffer的情况，所以即使在 gltf.mesh.length <=1 时开启interleave，也仍然存在重复创建相同webgl buffer问题
        this._enableInterleave = false;// count <= 1;
        this.glbBuffer = glbBuffer;
        this.buffers = {};
        this.requests = {};
        this.accessors = {};
        this._compareAccessor();
        this._fetchOptions = fetchOptions;
        this._urlModifier = urlModifier;
    }

    _requestData(name, accessorName) {
        const gltf = this.gltf,
            accessor = gltf.accessors[accessorName];
        if (accessor.bufferView === undefined) {
            this.accessors[accessor.id] = this._toBufferData(name, accessorName, null, 0);
            return Promise.resolve(this.accessors[accessor.id]);
        }
        if (accessor && this.accessors[accessor.id]) {
            return Promise.resolve(this.accessors[accessor.id]);
        }

        const bufferView = gltf.bufferViews[accessor.bufferView];
        return this._requestBufferOfBufferView(bufferView).then(buf => {
            const { buffer, byteOffset } = buf;
            const bufferData = this.accessors[accessor.id] = this._toBufferData(name, accessorName, buffer, byteOffset);
            return bufferData;
        });
    }

    _requestBufferOfBufferView(bufferView) {
        const gltf = this.gltf;
        const buffer = gltf.buffers[bufferView.buffer];

        if (this.buffers[buffer.id]) {
            const arrayBuffer = this.buffers[buffer.id];
            return Promise.resolve({
                buffer: arrayBuffer,
                byteOffset: 0
            });
        }
        if (this.requests[buffer.id]) {
            return this.requests[buffer.id].then(() => {
                const arrayBuffer = this.buffers[buffer.id];
                return Promise.resolve({
                    buffer: arrayBuffer,
                    byteOffset: 0
                });
            });
        }
        if (bufferView.buffer === 'binary_glTF' || bufferView.buffer === 'KHR_binary_glTF' || !buffer.uri) {
            //解析莆田box类型倾斜时发现的bug:
            // accessor中的byteOffset已经考虑了glb中的b3dm header长度，不用再单独加进去
            return Promise.resolve({
                buffer: this.glbBuffer.buffer,
                byteOffset: this.glbBuffer.byteOffset
            });
        } else {
            //load from external uri
            //对于base64的数据，可以直接转换为ArrayBuffer
            if (isDataUri(buffer.uri)) {
                const arrayBuffer = this.buffers[buffer.id] = dataUriToArrayBuffer(buffer.uri);
                return Promise.resolve({
                    buffer: arrayBuffer,
                    byteOffset: 0
                });
            }
            let url;
            const isBlob = buffer.uri.indexOf('blob:') >= 0;
            if (buffer.uri.indexOf('://') > 0 || isBlob) {
                url = buffer.uri;
            } else {
                url = this.rootPath + '/' + buffer.uri;
            }
            const promise = this.requests[buffer.id] = Ajax.getArrayBuffer(url, this._fetchOptions, !isBlob && this._urlModifier).then(response => {
                if (isBlob) {
                    // 5 is length of blob:
                    URL.revokeObjectURL(url);
                }
                const arrayBuffer = this.buffers[buffer.id] = response.data;
                return {
                    buffer: arrayBuffer,
                    byteOffset: 0
                };
            });
            return promise;
        }
    }

    _toBufferData(name, accessorName, arrayBuffer, offset = 0) {
        const gltf = this.gltf;
        const accessor = gltf.accessors[accessorName];

        const bufferView = accessor.bufferView !== undefined ? gltf.bufferViews[accessor.bufferView] : {};
        const start = (bufferView.byteOffset || 0) + offset;
        const itemSize = this._getTypeItemSize(accessor.type);
        const ctor = getTypedArrayCtor(accessor.componentType);
        const byteStride = bufferView.byteStride || 0;
        // if (byteStride === bytesPerElement * itemSize) {
        //     byteStride = 0;
        // }
        let array;
        const bufferData = {
            array,
            name,
            accessorName,
            // bufferView: accessor.bufferView,
            //array.buffer 上的 byteOffset

            byteLength: accessor.count * itemSize * ctor.BYTES_PER_ELEMENT,
            componentType: accessor.componentType,
            count: accessor.count,
            type: accessor.type,
            itemSize,
            max: accessor.max,
            min: accessor.min,
            extensions: accessor.extensions
        };
        if (accessor.min) {
            bufferData.min = accessor.min;
        }
        if (accessor.max) {
            bufferData.max = accessor.max;
        }
        if (arrayBuffer) {
            if (this._enableInterleave) {
                bufferData.byteStride = byteStride;
                bufferData.byteOffset = start + (accessor.byteOffset || 0);
                //如果有共用buffer
                if (!byteStride || byteStride === itemSize * ctor.BYTES_PER_ELEMENT || name === 'indices' || name === 'input' || name === 'output' || name.indexOf('morph') >= 0) {
                    bufferData.array = this._typedArray(arrayBuffer, accessor.count, itemSize, start + (accessor.byteOffset || 0), ctor);
                    if (bufferData.array.buffer.byteLength === bufferData.byteLength) {
                        bufferData.byteOffset = 0;
                    }
                } else {
                    bufferData.array = new Uint8Array(arrayBuffer, start, bufferView.byteLength);
                }

            } else {
                // 2021-12-13 不再支持共用buffer的interleaved模式
                // 1. 如果一个gltf文件中有多个mesh共享一个buffer，每个对应的reshader.Geometry中都会对同一个buffer创建一个reglBuffer
                // 2. 要实现多个reshader.Mesh共享reglBuffer，逻辑过于复杂
                // 2021-12-31 改为 toTypedArray 中不再默认创建新的arraybuffer，解决tokyo.html中，大量attribute复用同一数组时，内存增长过快的问题
                if (accessor.interleaved) {
                    bufferData.byteStride = 0;
                    bufferData.byteOffset = 0;
                    const out = new ctor(accessor.count * itemSize);
                    bufferData.array = readInterleavedArray(out, arrayBuffer, accessor.count, itemSize, byteStride, start + (accessor.byteOffset || 0), accessor.componentType);
                    if (bufferData.extensions && bufferData.extensions['WEB3D_quantized_attributes']) {
                        if (itemSize > 2) {//TEXCOORD_0在shader中解压
                            const newArray = new Float32Array(bufferData.array.length);
                            const { decodeMatrix } = bufferData.extensions['WEB3D_quantized_attributes'];
                            for (let i = 0; i < bufferData.array.length; i += itemSize) {
                                TEMP_VEC4[0] = bufferData.array[i], TEMP_VEC4[1] = bufferData.array[i + 1], TEMP_VEC4[2] = bufferData.array[i + 2], TEMP_VEC4[3] = 1;
                                const attr = vec4.transformMat4(TEMP_VEC4, TEMP_VEC4, decodeMatrix);
                                newArray[i] = attr[0];
                                newArray[i + 1] = attr[1];
                                newArray[i + 2] = attr[2];
                            }
                            bufferData.componentType = 5126;
                            bufferData.array = newArray;
                        }
                    }
                } else {
                    bufferData.byteStride = 0;
                    bufferData.array = this._typedArray(arrayBuffer, accessor.count, itemSize, start + (accessor.byteOffset || 0), ctor);
                    bufferData.byteOffset = bufferData.array.byteOffset;
                }
            }

        } else {
            // accessor上不存在bufferView的情况
            bufferData.array = new ctor(accessor.count);
            const minmax = bufferData.min || bufferData.max;
            if (minmax) {
                bufferData.array[0] = minmax[0];
                bufferData.array[1] = minmax[1];
                bufferData.array[2] = minmax[2];
            }
        }
        return bufferData;
    }

    _compareAccessor() {
        const accessors =  this.gltf.accessors;
        if (Array.isArray(accessors)) {
            for (let i = 0; i < accessors.length; i++) {
                for (let j = 0; j < accessors.length; j++) {
                    if (i !== j) {
                        if (accessors[i].bufferView === accessors[j].bufferView) {
                            accessors[i].interleaved = accessors[j].interleaved = true;
                        }
                    }
                }
            }
        } else {
            for (const i in accessors) {
                for (const j in accessors) {
                    if (i !== j) {
                        if (accessors[i].bufferView === accessors[j].bufferView) {
                            accessors[i].interleaved = accessors[j].interleaved = true;
                        }
                    }
                }
            }
        }
    }

    _typedArray(arrayBuffer, count, itemSize, start, ctor) {

        if (start % ctor.BYTES_PER_ELEMENT !== 0) {
            //拷贝 array buffer，以保证比特对齐
            //有些不太正规的数据没有比特对齐，此时 new Float32Array(offset,.. ) 会抛出 offset must be multiplier of 4 错误
            arrayBuffer = arrayBuffer.slice(start, start + count * itemSize * ctor.BYTES_PER_ELEMENT);
            start = 0;
            //拷贝了arraybuffer，不再使用老的buffer
        }
        return new ctor(arrayBuffer, start, itemSize * count);
    }

    _getTypeItemSize(type) {
        const typeIdx = TYPES.indexOf(type);
        return TYPES[typeIdx + 1];
    }

    requestKHRTechniquesWebgl(extension) {
        const { shaders } = extension;
        const promises = shaders.map(shader => {
            if (shader.bufferView !== undefined) {
                const bufferView = this.gltf.bufferViews[shader.bufferView];
                const { byteLength } = bufferView;
                return this._requestBufferOfBufferView(bufferView).then(buf => {
                    const { buffer, byteOffset } = buf;
                    const shaderContent = bufferToString(buffer, byteOffset + (bufferView.byteOffset || 0), byteLength);
                    shader.content = shaderContent;
                    return shader;
                });
            } else if (shader.uri) {
                if (isDataUri(shader.uri)) {
                    const buffer = dataUriToArrayBuffer(shader.uri);
                    const shaderContent = bufferToString(buffer, 0, buffer.byteLength);
                    shader.content = shaderContent;
                    return Promise.resolve(shader);
                } else {
                    const url = this.rootPath + '/' + shader.uri;
                    return Ajax.get(url, this._fetchOptions, this._urlModifier).then(content => {
                        shader.content = content;
                        return shader;
                    });
                }
            } else {
                return Promise.resolve(shader);
            }
        });
        return Promise.all(promises).then(() => {
            return extension
        });
    }
}
