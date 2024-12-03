import { getGLTFLoaderBundle } from '@maptalks/gl/dist/transcoders.js';
import { mat4, quat } from 'gl-matrix';

const { GLTFLoader } = getGLTFLoaderBundle();

export function iterateMesh(gltf, cb) {
    if (!gltf.scenes || !gltf.scenes.length) {
        return;
    }
    for (let i0 = 0, l0 = gltf.scenes.length; i0 < l0; i0++) {
        const nodes = gltf.scenes[i0].nodes;
        for (let i = 0, l = nodes.length; i < l; i++) {
            const matrices = [];
            const node = nodes[i];
            iterateNode(node, matrices, gltf, cb);
            // if (node.children && node.children.length) {
            //     for (let ii = 0, ll = node.children.length; ii < ll; ii++) {
            //         iterateNode(node.children[i], matrices, gltf, cb);
            //     }
            // }
        }
    }
}

const TMAT = [];
const RMAT = [];
const SMAT = [];
const EMPTY_T = [0, 0, 0];
const EMTPY_Q = quat.identity([]);
const EMPTY_S = [1, 1, 1];

function iterateNode(node, nodeMatrices, gltf, cb) {
    const matrices = nodeMatrices.slice(0);
    if (node.matrix) {
        matrices.push(node.matrix);
    } else if (node.rotation || node.translation || node.scale) {
        const tm = mat4.fromTranslation(TMAT, node.translation || EMPTY_T);
        const rm = mat4.fromQuat(RMAT, node.rotation || EMTPY_Q);
        const sm = mat4.fromScaling(SMAT, node.scale || EMPTY_S);
        mat4.multiply(sm, rm, sm);
        const matrix = mat4.multiply([], tm, sm);
        matrices.push(matrix);
    }
    if (node.children && node.children.length) {
        for (let ii = 0, ll = node.children.length; ii < ll; ii++) {
            iterateNode(node.children[ii], matrices, gltf, cb);
        }
    }
    if (node.mesh !== undefined) {
        const meshIndex = node.mesh;
        const mesh = gltf.meshes[meshIndex];
        if (mesh) {
            const mat = matrices.slice(0);
            const primitives = mesh.primitives;
            for (let ii = 0, ll = primitives.length; ii < ll; ii++) {
                const primitive = primitives[ii];
                if (primitive) {
                    primitive.matrices = mat;
                    cb(primitive, meshIndex, ii, gltf);
                }
            }
        }
    }
    // if (node.meshes && node.meshes.length) {
    //     for (let i = 0, l = node.meshes.length; i < l; i++) {
    //         const mesh = node.meshes[i];
    //         if (mesh) {
    //             const mat = matrices.slice(0);
    //             const primitives = mesh.primitives;
    //             for (let ii = 0, ll = primitives.length; ii < ll; ii++) {
    //                 const primitive = primitives[ii];
    //                 if (primitive) {
    //                     primitive.matrices = mat;
    //                     cb(primitive, gltf);
    //                 }
    //             }
    //         }
    //     }
    // }

}

// 遍历 GLTF-Loader 返回的bufferData
export function iterateBufferData(arr, cb) {
    let { byteOffset, byteStride: stride, count } = arr;
    const { componentType, itemSize } = arr;
    const arrayBuffer = arr.array.buffer;
    const ctor = componentType ? GLTFLoader.getTypedArrayCtor(componentType) : arr.array.constructor;
    byteOffset = byteOffset === undefined ? arr.array.byteOffset : byteOffset;
    stride = stride || 0;
    count = count || arr.array.length / itemSize;
    if ((!stride || stride === itemSize * ctor.BYTES_PER_ELEMENT) && byteOffset % ctor.BYTES_PER_ELEMENT === 0) {
        const src = new ctor(arrayBuffer, byteOffset, count * itemSize);
        for (let i = 0; i < count * itemSize; i+= itemSize) {
            const tempTypeArray = new ctor(src.buffer, byteOffset + i * ctor.BYTES_PER_ELEMENT, itemSize);
            cb(tempTypeArray, i / itemSize);
        }
        return;
    }
    const tempUint8 = new Uint8Array(itemSize * ctor.BYTES_PER_ELEMENT);
    if (!stride) {
        stride = itemSize * ctor.BYTES_PER_ELEMENT;
    }
    for (let i = 0; i < count; i++) {
        const start = stride * i + byteOffset;
        const uint8Arr = new Uint8Array(arrayBuffer, start, itemSize * ctor.BYTES_PER_ELEMENT);
        tempUint8.set(uint8Arr);
        const item = new ctor(tempUint8.buffer);
        cb(item, i);
        uint8Arr.set(tempUint8);
    }
}


// 从 GLTF-Loader 返回的bufferData获取指定位置的数据
export function getItemAtBufferData(out, arr, index) {
    let { byteOffset, byteStride: stride } = arr;
    const { componentType, itemSize } = arr;
    const arrayBuffer = arr.array.buffer;
    const ctor = componentType ? GLTFLoader.getTypedArrayCtor(componentType) : arr.array.constructor;
    byteOffset = byteOffset === undefined ? arr.array.byteOffset : byteOffset;
    stride = stride || 0;
    if (!stride || (stride === itemSize * ctor.BYTES_PER_ELEMENT && byteOffset % ctor.BYTES_PER_ELEMENT === 0)) {
        const src = new ctor(arrayBuffer, byteOffset + index * itemSize * ctor.BYTES_PER_ELEMENT, itemSize);
        out.set(src);
        return out;
    }
    if (!stride) {
        stride = itemSize * ctor.BYTES_PER_ELEMENT;
    }
    const start = stride * index + byteOffset;
    const uint8Arr = new Uint8Array(arrayBuffer, start, itemSize * ctor.BYTES_PER_ELEMENT);
    const tempUint8 = new Uint8Array(out.buffer);
    tempUint8.set(uint8Arr);
    return out;

}

export function setInstanceData(out, idx, matrix, row) {
    out[idx * 4] = matrix[row];
    out[idx * 4 + 1] = matrix[row + 4];
    out[idx * 4 + 2] = matrix[row + 8];
    out[idx * 4 + 3] = matrix[row + 12];
}


export function binarizeGLTF(rawGLTF, glb) {
    const encoder = new TextEncoder();
    const rawGLTFData = encoder.encode(JSON.stringify(rawGLTF));
    // const binaryGLTFData = new Uint8Array(rawGLTFData.byteLength + 20);

    let chunkPadding = 0;
    if (rawGLTFData.byteLength % 4 !== 0) {
        chunkPadding = 4 - rawGLTFData.byteLength % 4;
    }
    // JSON的长度是 rawGLTFData.byteLength + 20
    const binaryGLTFData = new Uint8Array(rawGLTFData.byteLength + 20 + chunkPadding + glb.byteLength + 8);
    const binaryGLTF = {
        magic: new Uint8Array(binaryGLTFData.buffer, 0, 4),
        version: new Uint32Array(binaryGLTFData.buffer, 4, 1),
        length: new Uint32Array(binaryGLTFData.buffer, 8, 1),
        chunkLength: new Uint32Array(binaryGLTFData.buffer, 12, 1),
        chunkType: new Uint32Array(binaryGLTFData.buffer, 16, 1),
        chunkData: new Uint8Array(
            binaryGLTFData.buffer,
            20,
            rawGLTFData.byteLength
        ),
        chunk1Length: new Uint32Array(binaryGLTFData.buffer, chunkPadding + 20 + rawGLTFData.byteLength, 1),
        chunk1Type: new Uint32Array(binaryGLTFData.buffer, chunkPadding + 24 + rawGLTFData.byteLength, 1),
        chunk1Data: new Uint8Array(
            binaryGLTFData.buffer,
            chunkPadding + 20 + rawGLTFData.byteLength + 4 + 4,
            glb.byteLength
        )
    };

    for (let i = 0; i < chunkPadding; i++) {
        // chunkPadding 用空格补充
        binaryGLTFData[rawGLTFData.byteLength + 20 + i] = 32;
    }

    binaryGLTF.magic[0] = "g".charCodeAt();
    binaryGLTF.magic[1] = "l".charCodeAt();
    binaryGLTF.magic[2] = "T".charCodeAt();
    binaryGLTF.magic[3] = "F".charCodeAt();

    binaryGLTF.version[0] = 2;
    binaryGLTF.length[0] = binaryGLTFData.byteLength;
    binaryGLTF.chunkLength[0] = rawGLTFData.byteLength + chunkPadding;
    binaryGLTF.chunkType[0] = 0x4e4f534a; // JSON
    binaryGLTF.chunkData.set(rawGLTFData);

    binaryGLTF.chunk1Length[0] = glb.byteLength;
    binaryGLTF.chunk1Type[0] = 0x004E4942;
    binaryGLTF.chunk1Data.set(glb);

    return binaryGLTFData;
}

export function binarizeB3DM(featureTableJSON, batchTabelJSON, binaryGLTFData) {
    const encoder = new TextEncoder();

    // Feature Table
    const featureTableOffset = 28;
    const featureTableJSONData = encoder.encode(featureTableJSON);
    const featureTableLength = featureTableJSONData.byteLength;

    // Batch Table
    const batchTableOffset = featureTableOffset + featureTableLength;
    const batchTableJSONData = encoder.encode(batchTabelJSON);

    // Calculate alignment buffer by padding the remainder of the batch table
    const paddingCount = (batchTableOffset + batchTableJSONData.byteLength) % 8;
    const batchTableLength = batchTableJSONData.byteLength + paddingCount;
    const paddingStart = batchTableJSONData.byteLength;
    const paddingStop = batchTableLength;

    // Binary GLTF
    const binaryGLTFOffset = batchTableOffset + batchTableLength;
    const binaryGLTFLength = binaryGLTFData.byteLength;

    const dataSize = featureTableLength + batchTableLength + binaryGLTFLength;
    const b3dmRawData = new Uint8Array(28 + dataSize);

    const b3dmData = {
        magic: new Uint8Array(b3dmRawData.buffer, 0, 4),
        version: new Uint32Array(b3dmRawData.buffer, 4, 1),
        byteLength: new Uint32Array(b3dmRawData.buffer, 8, 1),
        featureTableJSONByteLength: new Uint32Array(b3dmRawData.buffer, 12, 1),
        featureTableBinaryByteLength: new Uint32Array(b3dmRawData.buffer, 16, 1),
        batchTableJSONByteLength: new Uint32Array(b3dmRawData.buffer, 20, 1),
        batchTableBinaryByteLength: new Uint32Array(b3dmRawData.buffer, 24, 1),
        featureTable: new Uint8Array(
            b3dmRawData.buffer,
            featureTableOffset,
            featureTableLength
        ),
        batchTable: new Uint8Array(
            b3dmRawData.buffer,
            batchTableOffset,
            batchTableLength
        ),
        binaryGLTF: new Uint8Array(
            b3dmRawData.buffer,
            binaryGLTFOffset,
            binaryGLTFLength
        ),
    };

    b3dmData.magic[0] = "b".charCodeAt();
    b3dmData.magic[1] = "3".charCodeAt();
    b3dmData.magic[2] = "d".charCodeAt();
    b3dmData.magic[3] = "m".charCodeAt();

    b3dmData.version[0] = 1;
    b3dmData.byteLength[0] = b3dmRawData.byteLength;

    b3dmData.featureTable.set(featureTableJSONData);
    b3dmData.featureTableJSONByteLength[0] = featureTableLength;
    b3dmData.featureTableBinaryByteLength[0] = 0;

    b3dmData.batchTable.set(batchTableJSONData);
    for(let index = paddingStart; index < paddingStop; ++index) {
        b3dmData.batchTable[index] = 0x20;
    }
    b3dmData.batchTableJSONByteLength[0] = batchTableLength;
    b3dmData.batchTableBinaryByteLength[0] = 0;
    b3dmData.binaryGLTF.set(binaryGLTFData);

    return b3dmRawData;
}
