import { getGLTFLoaderBundle } from '@maptalks/gl/dist/transcoders.js';
import { readFeatureTableBatchTable, readBatchId, convertQuantizedPosition, getComponentFromCtor } from '../common/TileHelper.js';
import getTranscoders from './transcoders.js';
import { getBatchIdArrayType } from '../common/Util.js';

const { Ajax } = getGLTFLoaderBundle();

// s3m : https://github.com/SuperMap/s3m-spec
// b3dm: https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/TileFormats/Batched3DModel/README.md
//  b3dm legacy 24: https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/a45866de985f5b37aa98fc75340878d7a78e4056/TileFormats/Batched3DModel/README.md
//  b3dm legacy 20: https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/3c70a9c3d58f612218f1f51b12d2a0d92b3c9e32/TileFormats/Batched3DModel/README.md

export default class PNTSLoader {
    constructor() {
    }


    /**
     * 载入pnts模型，返回一个promise，promise中的参数是数据
     * @param {String} url - url of b3dm
     * @param {ArrayBuffer} [arraybuffer=null] - optional b3dm arraybuffer content
     * @returns {Promise}
     */
    load(url, arraybuffer, offset = 0, byteLength = 0) {
        if (arraybuffer) {
            if (!byteLength) {
                byteLength = arraybuffer.byteLength;
            }
            return this._parse(url, arraybuffer, offset, byteLength);
        }
        return Ajax.getArrayBuffer(url, {}).then(response => {
            const b3dm = response.data;
            if (!byteLength) {
                byteLength = b3dm.byteLength;
            }
            return this._parse(url, b3dm, offset, byteLength);
        });
    }

    _parse(url, pntsBuf, offset, byteLength) {
        return this._readPNTS(pntsBuf, offset, byteLength, url).then(components => {
            if (components.error) {
                return components;
            }
            return {
                magic: 'pnts',
                count: components.count,
                transferables: components.transferables, //for worker
                featureTable: components.featureTable,
                batchTable: components.batchTable,
                batchTableBin: components.batchTableBin,
                pnts: components.pnts
            };
        });
    }

    /**
     * 解析b3dm数据，返回数据块：
     * 1. feature table
     * 2. batch table
     * 3. gltf
     * @param {ArrayBuffer} pnts
     */
    _readPNTS(pntsBuf, offset, byteLength, url) {
        const view = new DataView(pntsBuf, offset, byteLength);
        const version = view.getUint32(4, true);
        if (version !== 1) {
            const info = 'Unsupported pnts version: ' + version + ', url:' + url;
            console.warn(info);
            return { error: info };
        }
        const length = view.getUint32(8, true);
        if (length !== view.byteLength) {
            const info = 'Length in pnts header is inconsistent with pnts\'s byte length, url: ' + url;
            console.warn(info);
            return { error: info };
        }

        const transferables = [pntsBuf];
        const { featureTable, featureTableBin, batchTable, batchTableBin } = readFeatureTableBatchTable(view, offset + 28, transferables);
        const quanVolOffset = featureTable['QUANTIZED_VOLUME_OFFSET'];
        const quanVolScale = featureTable['QUANTIZED_VOLUME_SCALE']

        const pointsLength = featureTable['POINTS_LENGTH'];

        let compression = {};
        let dracoBuf;
        if (featureTable['extensions'] && featureTable['extensions']['3DTILES_draco_point_compression']) {
            compression = featureTable['extensions']['3DTILES_draco_point_compression'];
            // dracoBuf = pntsBuf.slice(compression.byteOffset + featureTableBin.offset, compression.byteOffset + featureTableBin.offset + compression.byteLength);
            dracoBuf = new DataView(pntsBuf, compression.byteOffset + featureTableBin.offset, compression.byteLength);
            const dracoOptions = {
                attributes: compression.properties,
                useUniqueIDs: false
            };
            if (!this._draco) {
                this._draco = getTranscoders().draco;
            }
            return this._draco(dracoBuf, dracoOptions).then(data => {
                const attribData = data.attributes;
                if ((featureTable['POSITION'] || featureTable['POSITION_QUANTIZED']) && (!attribData['POSITION'] && !attribData['POSITION_QUANTIZED'])) {
                    attribData['POSITION'] = featureTable['POSITION'];
                    attribData['POSITION_QUANTIZED'] = featureTable['POSITION_QUANTIZED'];
                }
                if ((featureTable['RGB'] || featureTable['RGBA'] || featureTable['RGB565']) && (!attribData['RGB'] && !attribData['RGBA'] && !attribData['RGB565'])) {
                    attribData['RGB'] = featureTable['RGB'];
                    attribData['RGBA'] = featureTable['RGBA'];
                    attribData['RGB565'] = featureTable['RGB565'];
                }
                if ((featureTable['NORMAL'] || featureTable['NORMAL_OCT16P']) && (!attribData['NORMAL'] && !attribData['NORMAL_OCT16P'])) {
                    attribData['NORMAL'] = featureTable['NORMAL'];
                    attribData['NORMAL_OCT16P'] = featureTable['NORMAL_OCT16P'];
                }

                const pnts = this._readAttributes(pntsBuf, data.attributes, featureTableBin.offset, pointsLength, transferables, quanVolOffset, quanVolScale);
                if (data.attributes['BATCH_ID']) {
                    const array = data.attributes['BATCH_ID'].array;
                    pnts['BATCH_ID'] = {
                        byteStride: 0,
                        byteOffset: 0,
                        itemSize: 1,
                        count: array.length,
                        componentType: getComponentFromCtor(array.constructor),
                        array: array
                    }
                    transferables.push(array.buffer);
                } else  if (featureTable['BATCH_ID'] || Object.keys(batchTable).length) {
                    if (featureTable['BATCH_ID']) {
                        pnts['BATCH_ID'] = readBatchId(featureTable['BATCH_ID'], pntsBuf, featureTableBin.offset, pointsLength);
                    } else {
                        pnts['BATCH_ID'] = createPerPointBatchId(pointsLength);
                    }
                    const buffer = pnts['BATCH_ID'].array && pnts['BATCH_ID'].array.buffer;
                    if (buffer && transferables.indexOf(buffer) < 0) {
                        transferables.push(buffer);
                    }
                }
                return {
                    count: pointsLength,
                    batchTable,
                    batchTableBin,
                    featureTable,
                    pnts,
                    transferables
                }
            });
        }
        const pnts = this._readAttributes(pntsBuf, featureTable, featureTableBin.offset, pointsLength, transferables, quanVolOffset, quanVolScale);
        if (featureTable['BATCH_ID'] || Object.keys(batchTable).length) {
            if (featureTable['BATCH_ID']) {
                pnts['BATCH_ID'] = readBatchId(featureTable['BATCH_ID'], pntsBuf, featureTableBin.offset, pointsLength);
            } else {
                pnts['BATCH_ID'] = createPerPointBatchId(pointsLength);
            }
            const buffer = pnts['BATCH_ID'].array && pnts['BATCH_ID'].array.buffer;
            if (buffer && transferables.indexOf(buffer) < 0) {
                transferables.push(buffer);
            }
        }

        // position

        return Promise.resolve({
            count: pointsLength,
            batchTable,
            batchTableBin,
            featureTable,
            pnts,
            transferables
        });
    }

    _readAttributes(pntsBuf, attribData, attrByteOffset, pointsLength, transferables, quanVolOffset, quanVolScale) {
        const pnts = {};
        if (attribData['POSITION']) {
            let { byteOffset, array } = attribData['POSITION'];
            byteOffset = byteOffset || 0;
            const offset = (array ? 0 : attrByteOffset);
            if (!array) {
                const buf = pntsBuf.slice(byteOffset + offset, byteOffset + offset + pointsLength * 3 * 4);
                array = new Float32Array(buf);
            }
            pnts['POSITION'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 3,
                count: pointsLength,
                componentType: 5126,
                array: array
            };
            transferables.push(array.buffer);
        } else if (attribData['POSITION_QUANTIZED']) {
            let { byteOffset } = attribData['POSITION_QUANTIZED'];
            const { array } = attribData['POSITION_QUANTIZED'];
            byteOffset = byteOffset || 0;
            const offset = (array ? 0 : attrByteOffset);
            pnts['POSITION'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 3,
                count: pointsLength,
                componentType: 5126,
                array: this._convertQuantizedPosition(array || new Uint16Array(pntsBuf, byteOffset + offset, pointsLength * 3), quanVolOffset, quanVolScale)
            };
            transferables.push(pnts['POSITION'].array.buffer);
        }
        // color
        if (attribData['RGBA']) {
            let { byteOffset, array } = attribData['RGBA'];
            byteOffset = byteOffset || 0;
            const offset = (array ? 0 : attrByteOffset);
            if (!array) {
                const buf = pntsBuf.slice(byteOffset + offset, byteOffset + offset + pointsLength * 4);
                array = new Uint8Array(buf);
            }
            pnts['RGBA'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 4,
                count: pointsLength,
                componentType: 0x1401,
                array: array
            };
            transferables.push(array.buffer);
        } else if (attribData['RGB']) {
            let { byteOffset, array } = attribData['RGB'];
            byteOffset = byteOffset || 0;
            const offset = (array ? 0 : attrByteOffset);
            if (!array) {
                const buf = pntsBuf.slice(byteOffset + offset, byteOffset + offset + pointsLength * 3);
                array = new Uint8Array(buf);
            }
            pnts['RGB'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 3,
                count: pointsLength,
                componentType: 0x1401,
                array: array
            };
            transferables.push(array.buffer);
        } else if (attribData['RGB565']) {
            let { byteOffset, array } = attribData['RGB565'];
            byteOffset = byteOffset || 0;
            const offset = (array ? 0 : attrByteOffset);
            if (!array) {
                const buf = pntsBuf.slice(byteOffset + offset, byteOffset + offset + pointsLength * 2);
                array = new Uint16Array(buf);
            }
            pnts['RGB565'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 1,
                count: pointsLength,
                componentType: 0x1403,
                array: array
            };
            transferables.push(array.buffer);
        }
        // normal
        if (attribData['NORMAL']) {
            let { byteOffset, array } = attribData['NORMAL'];
            byteOffset = byteOffset || 0;
            const offset = (array ? 0 : attrByteOffset);
            if (!array) {
                const buf = pntsBuf.slice(byteOffset + offset, byteOffset + offset + pointsLength * 3 * 4);
                array = new Float32Array(buf);
            }
            pnts['NORMAL'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 3,
                count: pointsLength,
                componentType: 5126,
                array: array
            };
            transferables.push(array.buffer);
        } else if (attribData['NORMAL_OCT16P']) {
            let { byteOffset, array } = attribData['NORMAL_OCT16P'];
            byteOffset = byteOffset || 0;
            const offset = (array ? 0 : attrByteOffset);
            if (!array) {
                const buf = pntsBuf.slice(byteOffset + offset, byteOffset + offset + pointsLength * 2);
                array = new Uint8Array(buf);
            }
            pnts['NORMAL_OCT16P'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 2,
                count: pointsLength,
                componentType: 0x1401,
                array: array
            };
            transferables.push(array.buffer);
        }
        return pnts;
    }

    _convertQuantizedPosition(arr, offset, scale) {
        const position = new Float32Array(arr.length);
        return convertQuantizedPosition(position, arr, offset, scale);
    }

    //TODO
    _readBatchTable() {
        return null;
    }
}

// const DEFAULT_TYPES = {
//     'POSITION': 'Float32Array',
//     'POSITION_QUANTIZED': 'Uint16Array',
//     'RGBA': 'Uint8Array',
//     'RGB': 'Uint8Array',
//     'RGB565': 'Uint16Array',
//     'NORMAL': 'Float32Array',
//     'NORMAL_OCT16P': 'Uint8Array'
// };

// function getAttributeTypes(compressedProperties, featureTable) {
//     const types = {};
//     for (const p in compressedProperties) {
//         const prop = featureTable[p];
//         let typeName;
//         if (prop.componentType) {
//             typeName = getComponentCtor(prop.componentType).name
//         } else {
//             typeName = DEFAULT_TYPES[p];
//         }
//         if (typeName) {
//             types[compressedProperties[p]] = typeName
//         } else {
//             console.warn('undefined type of attribute:' + p);
//         }
//     }
//     return types;
// }

function createPerPointBatchId(pointsLength) {
    const ctor = getBatchIdArrayType(pointsLength);
    const array = new ctor(pointsLength);
    for (let i = 0; i < pointsLength; i++) {
        array[i] = i;
    }
    return {
        byteStride: 0,
        byteOffset: 0,
        itemSize: 1,
        count: pointsLength,
        componentType: getComponentFromCtor(ctor),
        array
    };
}
