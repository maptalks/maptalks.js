import { vec3 } from 'gl-matrix';
import { getGLTFLoaderBundle } from '@maptalks/gl/dist/transcoders.js';
import { readFeatureTableBatchTable, readBatchId, convertQuantizedPosition } from '../common/TileHelper.js';
import { stringFromUTF8Array } from '../common/Util.js';
import getTranscoders from './transcoders.js';

const { Ajax, GLTFLoader } = getGLTFLoaderBundle();

// https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/Instanced3DModel
export default class I3DMLoader {
    constructor(requestImage, loaderCtor, supportedFormats, maxTextureSize) {
        this._requestImage = requestImage;
        this._loaderCtor = loaderCtor || GLTFLoader;
        this._supportedFormats = supportedFormats;
        this._decoders = getTranscoders();
        this._maxTextureSize = maxTextureSize;
    }

    /**
     * 载入pnts模型，返回一个promise，promise中的参数是数据
     * @param {String} url - url of i3dm
     * @param {ArrayBuffer} [arraybuffer=null] - optional i3dm arraybuffer content
     * @returns {Promise}
     */
    load(url, arraybuffer, offset = 0, byteLength = 0, options) {
        if (arraybuffer) {
            if (!byteLength) {
                byteLength = arraybuffer.byteLength;
            }
            return this._parse(url, arraybuffer, offset, byteLength, options);
        }
        return Ajax.getArrayBuffer(url, {}).then(response => {
            const i3dm = response.data;
            if (!byteLength) {
                byteLength = i3dm.byteLength;
            }
            return this._parse(url, i3dm, offset, byteLength);
        });
    }

    _parse(url, buf, offset, byteLength, options) {
        return this._parseGLTF(url, buf, offset, byteLength, options).then(({ gltf, transferables }) => {
            const components = this._readI3DM(buf, offset, byteLength, url);
            if (components.error) {
                return Promise.resolve(components);
            }
            for (let i = 0; i < transferables.length; i++) {
                if (components.transferables.indexOf(transferables[i]) === -1) {
                    components.transferables.push(transferables[i]);
                }
            }
            delete gltf.transferables;
            return Promise.resolve({
                magic: 'i3dm',
                count: components.count,
                transferables: components.transferables, //for worker
                featureTable: components.featureTable,
                batchTable: components.batchTable,
                batchTableBin: components.batchTableBin,
                i3dm: components.i3dm,
                gltf
            });
        });

    }

    _parseGLTF(i3dmURL, buf, offset, byteLength, opts) {
        const maxTextureSize = opts && opts.maxTextureSize;
        const options = {
            transferable: true,
            requestImage: this._requestImage,
            decoders: this._decoders,
            supportedFormats: this._supportedFormats,
            maxTextureSize
        };
        const view = new DataView(buf, offset, byteLength);
        const featureTableJSONLength = view.getUint32(12, true);
        const featureTableBinLength = view.getUint32(16, true);
        const batchTableJSONLength = view.getUint32(20, true);
        const batchTableBinLength = view.getUint32(24, true);
        const gltfFormat = view.getUint32(28, true);

        // i3dm header length
        const headerLength = 32;
        const gltfBinStart = headerLength + featureTableJSONLength + featureTableBinLength + batchTableJSONLength + batchTableBinLength;
        if (gltfFormat === 0) {
            //url
            const urlBuf = new Uint8Array(buf, gltfBinStart + offset, view.byteLength - gltfBinStart);
            let url = stringFromUTF8Array(urlBuf);
            if (url.indexOf('://') == -1) {
                // relative path
                url = i3dmURL.substring(0, i3dmURL.lastIndexOf('/')) + '/' + url;
            }
            const isGLB = url.indexOf('.glb') > 0;
            if (isGLB) {
                return Ajax.getArrayBuffer(url, {}).then(bin => {
                    return this._createGLTFLoader(url, { buffer: bin.data, byteOffset: 0 }, options);
                });
            } else {
                return Ajax.getJSON(url, {}).then(json => {
                    return this._createGLTFLoader(url, json, options);
                });
            }
        } else {
            const glb = {
                buffer: buf,
                byteOffset: gltfBinStart + offset,
                byteLength: view.byteLength - gltfBinStart
            };
            return this._createGLTFLoader(i3dmURL, glb, options);
        }
    }

    _createGLTFLoader(url, data, options) {
        const rootPath = url.substring(0, url.lastIndexOf('/'));
        const loader = new this._loaderCtor(rootPath, data, options);
        // turn on skipAttributeTransform in default
        return loader.load({ skipAttributeTransform: true }).then(gltf => {
            let offset = 0, byteLength = 0;
            if (data.buffer) {
                offset = data.byteOffset || 0;
                byteLength = data.byteLength || 0;
            }
            gltf.url = `${url}-${offset}-${byteLength}`;
            return {
                transferables : loader.transferables, //for worker
                gltf
            };
        });
    }

    /**
     * 解析i3dm数据，返回数据块：
     * 1. feature table
     * 2. batch table
     * 3. gltf
     * @param {ArrayBuffer} pnts
     */
    _readI3DM(i3dmBuf, offset, byteLength, url) {
        const view = new DataView(i3dmBuf, offset, byteLength);
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
        const transferables = [i3dmBuf];

        const { featureTable, featureTableBin, batchTable, batchTableBin } = readFeatureTableBatchTable(view, 32 + offset, transferables);

        const i3dm = {};

        const instanceLength = featureTable['INSTANCES_LENGTH'];
        // position
        if (featureTable['POSITION']) {
            const { byteOffset } = featureTable['POSITION'];
            i3dm['POSITION'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 3,
                count: instanceLength,
                componentType: 5126,
                array: new Float32Array(i3dmBuf, byteOffset + featureTableBin.offset, instanceLength * 3).slice()
            };
            transferables.push(i3dm['POSITION'].array.buffer);
        } else if (featureTable['POSITION_QUANTIZED']) {
            const quanVolOffset = featureTable['QUANTIZED_VOLUME_OFFSET'];
            const quanVolScale = featureTable['QUANTIZED_VOLUME_SCALE'];

            const { byteOffset } = featureTable['POSITION_QUANTIZED'];
            i3dm['POSITION'] = {
                byteStride: 3 * 4,
                byteOffset: 0,
                itemSize: 3,
                count: instanceLength,
                componentType: 5126,
                array: this._convertQuantizedPosition(new Uint16Array(i3dmBuf, byteOffset + featureTableBin.offset, instanceLength * 3), quanVolOffset, quanVolScale)
            };
            transferables.push(i3dm['POSITION'].array.buffer);
        }

        if (featureTable['BATCH_ID']) {
            i3dm['BATCH_ID'] = readBatchId(featureTable['BATCH_ID'], i3dmBuf, featureTableBin.offset, instanceLength);
            const buffer = i3dm['BATCH_ID'].array && i3dm['BATCH_ID'].array.buffer;
            if (buffer && transferables.indexOf(buffer) < 0) {
                transferables.push(buffer);
            }
        }

        // normal
        if (featureTable['NORMAL_UP']) {
            let { byteOffset } = featureTable['NORMAL_UP'];
            i3dm['NORMAL_UP'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 3,
                count: instanceLength,
                componentType: 5126,
                array: new Float32Array(i3dmBuf, byteOffset + featureTableBin.offset, instanceLength * 3).slice()
            };
            transferables.push(i3dm['NORMAL_UP'].array.buffer);

            byteOffset = featureTable['NORMAL_RIGHT'].byteOffset;
            i3dm['NORMAL_RIGHT'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 3,
                count: instanceLength,
                componentType: 5126,
                array: new Float32Array(i3dmBuf, byteOffset + featureTableBin.offset, instanceLength * 3).slice()
            };
            transferables.push(i3dm['NORMAL_RIGHT'].array.buffer);
        } else if (featureTable['NORMAL_UP_OCT32P']) {
            let { byteOffset } = featureTable['NORMAL_UP_OCT32P'];
            i3dm['NORMAL_UP'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 3,
                count: instanceLength,
                componentType: 5126,
                array: this._decodeOCT32p(new Uint16Array(i3dmBuf, byteOffset + featureTableBin.offset, instanceLength * 2))
            };
            transferables.push(i3dm['NORMAL_UP'].array.buffer);

            byteOffset = featureTable['NORMAL_RIGHT_OCT32P'].byteOffset;
            i3dm['NORMAL_RIGHT'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 3,
                count: instanceLength,
                componentType: 5126,
                array: this._decodeOCT32p(new Uint16Array(i3dmBuf, byteOffset + featureTableBin.offset, instanceLength * 2))
            };
            transferables.push(i3dm['NORMAL_RIGHT'].array.buffer);
        }

        if (featureTable['SCALE']) {
            const { byteOffset } = featureTable['SCALE'];
            i3dm['SCALE'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 1,
                count: instanceLength,
                componentType: 5126,
                array: new Float32Array(i3dmBuf, byteOffset + featureTableBin.offset, instanceLength).slice()
            };
            transferables.push(i3dm['SCALE'].array.buffer);
        } else if (featureTable['SCALE_NON_UNIFORM']) {
            const { byteOffset } = featureTable['SCALE_NON_UNIFORM'];
            i3dm['SCALE_NON_UNIFORM'] = {
                byteStride: 0,
                byteOffset: 0,
                itemSize: 3,
                count: instanceLength,
                componentType: 5126,
                array: new Float32Array(i3dmBuf, byteOffset + featureTableBin.offset, instanceLength * 3).slice()
            };
            transferables.push(i3dm['SCALE_NON_UNIFORM'].array.buffer);
        }
        return {
            count: instanceLength,
            batchTable,
            batchTableBin,
            featureTable,
            i3dm,
            transferables: transferables
        };
    }

    _decodeOCT32p(arr) {
        const count = arr.length / 2;
        const result = new Float32Array(count * 3);
        const v = [];
        for (let i = 0; i < count; i++) {
            octDecodeInRange(v, arr[i * 2], arr[i * 2 + 1], 65535);
            result[i * 3] = v[0];
            result[i * 3 + 1] = v[1];
            result[i * 3 + 2] = v[2];
        }
        return result;
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

function octDecodeInRange(out, x, y, rangeMax) {
    out[0] = fromSNorm(x, rangeMax);
    out[1] = fromSNorm(y, rangeMax);
    out[2] = 1.0 - (Math.abs(out[0]) + Math.abs(out[1]));

    if (out[2] < 0.0) {
        const oldVX = out[0];
        out[0] = (1.0 - Math.abs(out[1])) * signNotZero(oldVX);
        out[1] = (1.0 - Math.abs(oldVX)) * signNotZero(out[1]);
    }

    return vec3.normalize(out, out);
}

function fromSNorm(value, rangeMaximum) {
    rangeMaximum = defaultValue(rangeMaximum, 255);
    return (
        (clamp(value, 0.0, rangeMaximum) / rangeMaximum) * 2.0 - 1.0
    );
}

function signNotZero(value) {
    return value < 0.0 ? -1.0 : 1.0;
}

function defaultValue(a, b) {
    if (a !== undefined && a !== null) {
        return a;
    }
    return b;
}

function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
}
