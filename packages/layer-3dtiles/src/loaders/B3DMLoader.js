import { getGLTFLoaderBundle } from '@maptalks/gl/dist/transcoders.js';
import { readFeatureTableJSON, readBatchTableJSON, readBatchTableBin, readBatchId } from '../common/TileHelper.js';
// 不能这样引用: import { transcoders } from '@maptalks/gl'，因为会把gl及相关依赖库（如maptalks）都引用进来
import getTranscoders from './transcoders.js';

const { Ajax, GLTFLoader } = getGLTFLoaderBundle();

// s3m : https://github.com/SuperMap/s3m-spec
// b3dm: https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/TileFormats/Batched3DModel/README.md
//  b3dm legacy 24: https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/a45866de985f5b37aa98fc75340878d7a78e4056/TileFormats/Batched3DModel/README.md
//  b3dm legacy 20: https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/3c70a9c3d58f612218f1f51b12d2a0d92b3c9e32/TileFormats/Batched3DModel/README.md

export default class B3DMLoader {
    constructor(requestImage, loaderCtor, supportedFormats) {
        this._requestImage = requestImage;
        this._loaderCtor = loaderCtor || GLTFLoader;
        this._supportedFormats = supportedFormats;
        this._decoders = getTranscoders();
    }

    static createEmptyB3DM() {
        return {
            featureTable : null,
            batchTable : null,
            gltf : {}
        };
    }

    /**
     * 载入b3dm模型，返回一个promise，promise中的参数是 gltf 模型对象
     * @param {String} url - url of b3dm
     * @param {ArrayBuffer} [arraybuffer=null] - optional b3dm arraybuffer content
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
            const b3dm = response.data;
            if (!byteLength) {
                byteLength = b3dm.byteLength;
            }
            return this._parse(url, b3dm, offset, byteLength);
        });
    }

    _parse(url, b3dm, offset, b3dmByteLength, options) {
        const maxTextureSize = options && options.maxTextureSize;
        const components = this._readB3DM(b3dm, offset, b3dmByteLength, url);
        if (components.error) {
            return Promise.resolve(components);
        }
        const rootPath = url.substring(0, url.lastIndexOf('/'));
        let loader;
        try {
            loader = new this._loaderCtor(rootPath, components.glb, {
                transferable: true,
                requestImage: this._requestImage,
                decoders: this._decoders,
                supportedFormats: this._supportedFormats,
                maxTextureSize
            });
        } catch (e) {
            return Promise.resolve({ error: e });
        }

        return loader.load({ skipAttributeTransform: false }).then(gltf => {
            // 相同url的geometry会缓存在MeshPainter中，不会重复创建
            // url里必须加上offset和b3dmByteLength，是因为一个url中可能包含多个不同的gltf模型
            gltf.url = `${url}-${offset}-${b3dmByteLength}`;
            const transferables = loader.transferables;
            for (let i = 0; i < components.transferables.length; i++) {
                if (transferables.indexOf(components.transferables[i]) < 0) {
                    transferables.push(components.transferables[i]);
                }
            }
            return {
                magic: 'b3dm',
                count: components.count,
                transferables, //for worker
                featureTable: components.featureTable,
                batchTable: components.batchTable,
                batchTableBin: components.batchTableBin,
                gltf
            };
        });
    }

    /**
     * 解析b3dm数据，返回数据块：
     * 1. feature table
     * 2. batch table
     * 3. gltf
     * @param {ArrayBuffer} b3dm
     */
    _readB3DM(b3dm, offset, byteLength, url) {
        const view = new DataView(b3dm, offset, byteLength);
        const version = view.getUint32(4, true);
        if (version !== 1) {
            const info = 'Unsupported b3dm version: ' + version + ', url:' + url;
            console.warn(info);
            return { error: info };
        }
        const length = view.getUint32(8, true);
        if (length !== view.byteLength) {
            const info = 'Length in b3dm header is inconsistent with b3dm\'s byte length, url: ' + url;
            console.warn(info);
            return { error: info };
        }
        // let headerLength = 28;
        // const versions = [20, 24, 28];

        // for (let i = 0; i < versions.length; i++) {
        //     const magic = view.getUint32(versions[i], true);
        //     // 1179937895 is uint32 version of 'gltf'
        //     if (magic === 1179937895) {
        //         headerLength = versions[i];
        //         break;
        //     }
        // }

        let featureTableJsonByteLength = view.getUint32(12, true);
        let featureTableBinaryByteLength = view.getUint32(16, true);
        let batchTableJsonByteLength = view.getUint32(20, true);
        let batchTableBinaryByteLength = view.getUint32(24, true);

        let byteOffset = 28 + offset;
        let batchLength;
        // from Cesium.js, Batched3DModel3DTileContent.js
        if (batchTableJsonByteLength >= 570425344) {
            // 'This b3dm header is using the legacy format [batchLength] [batchTableByteLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength] from https://github.com/CesiumGS/3d-tiles/tree/master/specification/TileFormats/Batched3DModel.'
            byteOffset -= 4 * 2;
            batchLength = featureTableJsonByteLength;
            batchTableJsonByteLength = featureTableBinaryByteLength;
            batchTableBinaryByteLength = 0;
            featureTableJsonByteLength = 0;
            featureTableBinaryByteLength = 0;
        } else if (batchTableBinaryByteLength >= 570425344) {
            // This b3dm header is using the legacy format [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength] from https://github.com/CesiumGS/3d-tiles/tree/master/specification/TileFormats/Batched3DModel.
            byteOffset -= 4;
            batchLength = batchTableJsonByteLength;
            batchTableJsonByteLength = featureTableJsonByteLength;
            batchTableBinaryByteLength = featureTableBinaryByteLength;
            featureTableJsonByteLength = 0;
            featureTableBinaryByteLength = 0;
        }

        const transferables = [b3dm];
        let featureTable;
        let featureTableBin;

        if (featureTableJsonByteLength > 0) {
            featureTable = readFeatureTableJSON(b3dm, byteOffset, featureTableJsonByteLength);
            byteOffset += featureTableJsonByteLength;
            batchLength = featureTable['BATCH_LENGTH'];
        } else {
            featureTable = {
                'BATCH_LENGTH': batchLength
            };
        }

        if (featureTableBinaryByteLength > 0) {
            // featureTableBin = readFeatureTableBin(b3dm, byteOffset, featureTableBinaryByteLength);
            byteOffset += featureTableBinaryByteLength;
        }

        let batchTable, batchTableBin;
        if (batchTableJsonByteLength > 0) {
            batchTable = readBatchTableJSON(b3dm, byteOffset, batchTableJsonByteLength);
            byteOffset += batchTableJsonByteLength;
            if (batchTableBinaryByteLength > 0) {
                const batchTableBinInfo = readBatchTableBin(b3dm, byteOffset, batchTableBinaryByteLength);
                batchTableBin = b3dm.slice(batchTableBinInfo.offset, batchTableBinInfo.offset + batchTableBinInfo.byteLength);
                byteOffset += batchTableBinaryByteLength;
                transferables.push(batchTableBin);
            }
        }



        const count = featureTable['BATCH_LENGTH'];
        const b3dmData = {};
        if (featureTable && featureTable['BATCH_ID']) {
            b3dmData['BATCH_ID'] = readBatchId(featureTable['BATCH_ID'], b3dm, featureTableBin.offset, count);
            const buffer = b3dmData['BATCH_ID'].array && b3dmData['BATCH_ID'].array.buffer;
            if (buffer && transferables.indexOf(buffer) < 0) {
                transferables.push(buffer);
            }
        }

        const glb = {
            buffer: b3dm,
            byteOffset: byteOffset,
            byteLength: view.byteLength + view.byteOffset - byteOffset
        };
        return {
            count: batchLength,
            transferables,
            featureTable,
            batchTable,
            batchTableBin,
            b3dm: b3dmData,
            glb
        };
    }

    //TODO
    _readBatchTable() {
        return null;
    }
}

