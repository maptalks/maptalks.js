import { getGLTFLoaderBundle } from '@maptalks/gl/dist/transcoders.js';
import { readMagic } from '../common/TileHelper';
import B3DMLoader from '../loaders/B3DMLoader';
import I3DMLoader from '../loaders/I3DMLoader';
import PNTSLoader from '../loaders/PNTSLoader';

const { Ajax, GLTFLoader } = getGLTFLoaderBundle();

// https://github.com/CesiumGS/3d-tiles/blob/main/specification/TileFormats/Composite/README.md

export default class CMPTLoader {
    constructor(requestImage, GLTFloaderCtor, supportedFormats, maxTextureSize) {
        this._supportedFormats = supportedFormats;
        this._requestImage = requestImage;
        this._loaderCtor = GLTFloaderCtor || GLTFLoader;
        this._maxTextureSize = maxTextureSize;
    }


    /**
     * 载入b3dm模型，返回一个promise，promise中的参数是 gltf 模型对象
     * @param {String} url - url of b3dm
     * @param {ArrayBuffer} [arraybuffer=null] - optional b3dm arraybuffer content
     * @returns {Promise}
     */
    load(url, arraybuffer, offset = 0, byteLength = 0, options) {
        if (arraybuffer) {
            return this._parse(url, arraybuffer, offset, byteLength, options);
        }
        return Ajax.getArrayBuffer(url, {}).then(response => {
            const cmpt = response.data;
            return this._parse(url, cmpt, offset, byteLength);
        });
    }

    _parse(url, cmpt, offset, byteLength, options) {
        if (!byteLength) {
            byteLength = cmpt.byteLength;
        }
        const tiles = this._readCMPT(cmpt, url, offset, byteLength);
        const promises = [];
        for (let i = 0; i < tiles.length; i++) {
            let loader;
            if (tiles[i].magic === 'b3dm') {
                loader = new B3DMLoader(this._requestImage, this._loaderCtor, this._supportedFormats);
            } else if (tiles[i].magic === 'i3dm') {
                loader = new I3DMLoader(this._requestImage, this._loaderCtor, this._supportedFormats, this._maxTextureSize);
            } else if (tiles[i].magic === 'pnts') {
                loader = new PNTSLoader();
            } else if (tiles[i].magic === 'cmpt') {
                loader = new CMPTLoader(this._requestImage, this._loaderCtor, this._supportedFormats, this._maxTextureSize);
            } else {
                // unsupported magic
                console.warn('Unsupported magic in CMPT tile:', tiles[i].magic);
                continue;
            }
            promises.push(loader.load(url, cmpt, tiles[i].offset, tiles[i].byteLength, options).then(data => {
                return data;
            }));
        }
        return Promise.all(promises).then(tiles => {
            return {
                magic: 'cmpt',
                tiles
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
    _readCMPT(cmpt, url, byteOffset, byteLength) {
        const view = new DataView(cmpt, byteOffset, byteLength);
        const version = view.getUint32(4, true);
        if (version !== 1) {
            const info = 'Unsupported cmpt version: ' + version + ', url:' + url;
            console.warn(info);
            return { error: info };
        }
        // const length = view.getUint32(8, true);
        // if (length !== view.byteLength) {
        //     const info = 'Length in cmpt header is inconsistent with cmpt\'s byte length, url: ' + url;
        //     console.warn(info);
        //     return { error: info };
        // }
        if (view.byteLength === 16) {
            // an empty cmpt tile
            return [];
        }
        const tiles = [];
        const tilesLength = view.getUint32(12, true);
        // 16是CMPT的header长度
        const headerLength = 16;
        let offset = headerLength;
        for (let i = 0; i < tilesLength; i++) {
            const magic = readMagic(view, offset);
            const tileByteLength = view.getUint32(offset + 8, true);
            tiles.push({
                magic,
                buffer: cmpt,
                offset: offset + byteOffset,
                byteLength: tileByteLength
            });
            offset += tileByteLength;
        }
        return tiles;
    }
}
