import { getGLTFLoaderBundle } from '@maptalks/gl/dist/transcoders.js';
import { vec3, mat3, mat4 } from 'gl-matrix';
import B3DMLoader from '../loaders/B3DMLoader';
import I3DMLoader from '../loaders/I3DMLoader';
import CMPTLoader from '../loaders/CMPTLoader';
import PNTSLoader from '../loaders/PNTSLoader';
import { isNil, stringFromUTF8Array } from '../common/Util';
import { readMagic } from '../common/TileHelper';
import { cartesian3ToDegree } from '../common/Transform';
import { iterateMesh, iterateBufferData } from '../common/GLTFHelpers';
/*import { I3SLoader } from '@loaders.gl/i3s';*/
// import { convertS3MJSON } from './parsers/s3m/S3MHelper';
// import parseS3M from './parsers/s3m/S3MParser';
import { isI3SURL, loadI3STile } from './parsers/i3s/I3SWorkerHelper';
import { buildNormals } from '@maptalks/tbn-packer';
import { project } from './Projection';
import getTranscoders from '../loaders/transcoders.js';

const { Ajax, GLTFLoader } = getGLTFLoaderBundle();

const DEFAULT_MAX_TEXTURE_SIZE = 0;
const Y_TO_Z = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1];
const X_TO_Z = [0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1];
const RATIO = 2 * Math.PI * 6378137 / 360;

const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

let supportOffscreenLoad = false;
let canvas, ctx;
if (typeof OffscreenCanvas !== 'undefined') {
    try {
        ctx = new OffscreenCanvas(2, 2).getContext('2d', { willReadFrequently: true });
    } catch (err) {
        // nothing need to do
    }
    if (ctx && typeof createImageBitmap !== 'undefined') {
        supportOffscreenLoad = true;
    }
}

const IDENTITY_MATRIX = mat4.identity([]);

const EMPTY_RTCCENTER = [0 ,0, 0];
const TMP_NODE_MATRIX = [];
const TMP_INV_MATRIX = [];

const TEMP_DEGREE = [];
const TEMP_PROJ = [];
const NEED_COMPRESSED_ATTR = { 'POSITION': 1, 'TEXCOORD_0': 1, 'TEXCOORD_1': 1, 'NORMAL': 1, 'TANGENT': 1};
const COMPRESSED_ERROR = {
    'TEXCOORD_0': 0.0001,
    'TEXCOORD_1': 0.0001
};

let POS_FOR_NORMAL;

export default class BaseLayerWorker {

    constructor(id, options, uploader, cb) {
        this.id = id;
        this.options = options;
        this._bindedRequestImage = (...args) => {
            return this.requestImage.call(this, ...args);
        };
        this._uploader = uploader;
        this._requests = {};
        cb(null, {}, []);
    }

    _createLoaders(supportedFormats) {
        if (this._b3dmLoader) {
            return;
        }
        this._supportedFormats = supportedFormats;
        this._pntsLoader = new PNTSLoader();
        this._b3dmLoader = new B3DMLoader(this._bindedRequestImage, GLTFLoader, supportedFormats);
        this._i3dmLoader = new I3DMLoader(this._bindedRequestImage, GLTFLoader, supportedFormats);
    }

    requestImage(url, cb) {
        if (supportOffscreenLoad) {
            // cb(null, { width : 2, height : 2, data : new Uint8Array(4) });
            fetch(url)
                .then(res => res.arrayBuffer())
                .then(buffer => {
                    const blob = new self.Blob([new Uint8Array(buffer)]);
                    return createImageBitmap(blob);
                })
                .then(bitmap => {
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    ctx.drawImage(bitmap, 0, 0);
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    bitmap.close();
                    // debugger
                    cb(null, { width: bitmap.width, height: bitmap.height, data: new Uint8Array(imgData.data) });
                });
        } else {
            this._uploader('requestImage', { url }, null, cb);
        }
    }

    /**
     * Load content of a 3d tile, maybe a tileset json or a b3dm binary
     * @param {Object} params  - mapid, layerid, url, arraybuffer
     * @param {Function} cb - callback function when finished
     */
    loadTile(params, cb) {
        this._createLoaders(params.supportedFormats);
        const { service, url, arraybuffer } = params;
        const fetchOptions = service['fetchOptions'] || {};
        fetchOptions.referrer = params.referrer;
        fetchOptions.referrerPolicy = fetchOptions.referrerPolicy || 'origin';
        if (isI3SURL(url)) {
            const i3sInfo = params.i3sInfo;
            const maxTextureSize = service.maxTextureSize || DEFAULT_MAX_TEXTURE_SIZE;
            const promise = loadI3STile(i3sInfo, params.supportedFormats, this.options.projection, params.projection, maxTextureSize, fetchOptions);
            promise.then(i3sData => {
                delete this._requests[url];
                if (!i3sData) {
                    cb({ status: 404, url, i3sInfo });
                    return;
                }
                if (!Object.keys(i3sData.gltf.meshes).length) {
                    // gltf中的mesh不存在
                    cb({ status: 404, url, i3sInfo });
                    return;
                }
                i3sData.gltf.url = url;
                const { transferables } = i3sData;
                i3sData.magic = 'b3dm';
                if (service.createNormalIfMissed) {
                    this._createGLTFMissedAttrs(i3sData.gltf);
                }
                if (ifCompressGeometry(service)) {
                    this._compressAttrFloat32ToInt16(i3sData.gltf);
                }
                cb(null, i3sData, transferables);
            });
            this._requests[url] = promise.xhr;
            return;
        }
        if (arraybuffer) {
            delete this._requests[url];
            const view = new DataView(arraybuffer);
            const magic = readMagic(view, 0);
            if (magic[0] === '{' || magic[0] === ' ' || magic[0] === '<') {
                // '{' 或空格 ' ', 表明是个json文件
                const str = readString(arraybuffer, 0, arraybuffer.byteLength);
                const json = JSON.parse(str);
                if (json.accessors) {
                    this._read3DTile(json, url, params, 'gltf', cb);
                } else {
                    this._checkAndConvert(params.rootIdx, json, arraybuffer, url, cb);
                }
                // if (magic[0] === '<') {
                //     try {
                //         const json = this._checkAndConvertS3MXML(str);
                //         cb(null, json);
                //     } catch (err) {
                //         cb(url + '\nEror when parsing xml:\n' + err);
                //     }

                // } else {
                //     let json = JSON.parse(str);
                //     json = this._checkAndConvert(json);
                //     cb(null, json);
                // }

            } else {
                // if (url.indexOf('Tile_-12985_43517_0000.s3mb') < 0) {
                //     cb('ignore');
                //     return;
                // }
                // const s3mVersion = view.getFloat32(0, true);
                // if (s3mVersion === 1 || s3mVersion === 2 || s3mVersion === 3) {
                //     this._readS3M(arraybuffer, url, params, cb);
                // } else {
                //     this._read3DTile(arraybuffer, url, params, magic, cb);
                // }
                this._read3DTile(arraybuffer, url, params, magic, cb);
            }
        } else {
            let urlParams = service['urlParams'];
            if (urlParams) {
                urlParams = (url.indexOf('?') > 0 ? '&' : '?') + urlParams;
            }
            const requrl = url.replace(/\+/g, '%2B');
            let promise = Ajax.getArrayBuffer(requrl + (urlParams || ''), fetchOptions);
            const xhr = promise.xhr;
            promise = promise.then(data => {
                delete this._requests[url];
                if (data && data.status) {
                    cb(data)
                    return;
                }
                params.arraybuffer = data && data.data;
                this.loadTile(params, cb);
            }).catch(err => {
                delete this._requests[url];
                cb(err);
            });
            this._requests[url] = xhr;
        }
    }


    _read3DTile(arraybuffer, url, params, magic, cb) {
        magic = magic && magic.toLowerCase();
        const { service } = params;
        if (magic === 'b3dm') {
            const promise = this._b3dmLoader.load(url, arraybuffer, 0, 0, { maxTextureSize: service.maxTextureSize || DEFAULT_MAX_TEXTURE_SIZE });
            promise.then(tile => {
                if (tile.error) {
                    cb(tile);
                    return;
                }
                const { content, transferables } = this._processB3DM(tile, params);
                if (service.createNormalIfMissed) {
                    this._createGLTFMissedAttrs(content.gltf);
                }
                if (ifCompressGeometry(service)) {
                    this._compressAttrFloat32ToInt16(content.gltf);
                }
                cb(null, content, transferables);
            }).catch(err => {
                cb(err);
            });
        } else if (magic === 'pnts') {
            const transform = params.transform || IDENTITY_MATRIX;
            const promise = this._pntsLoader.load(url, arraybuffer);
            promise.then(tile => {
                const { content:pnts, transferables } = this._loadPNTS(tile, transform, params.rootIdx);
                this._compressPNTSFloat32ToInt16(pnts);
                cb(null, pnts, transferables);
            });
        } else if (magic === 'i3dm') {
            const transform = params.transform || IDENTITY_MATRIX;
            const promise =  this._i3dmLoader.load(url, arraybuffer, 0, 0, { maxTextureSize: service.maxTextureSize || DEFAULT_MAX_TEXTURE_SIZE });
            promise.then(tile => {
                const { content:i3dm, transferables } = this._loadI3DM(tile, transform, params.rootIdx);
                if (service.createNormalIfMissed) {
                    this._createGLTFMissedAttrs(i3dm.gltf);
                }
                if (ifCompressGeometry(service)) {
                    this._compressAttrFloat32ToInt16(i3dm.gltf);
                }
                cb(null, i3dm, transferables);
            });
        } else if (magic === 'cmpt') {
            const promise = new CMPTLoader(this._bindedRequestImage, GLTFLoader, this._supportedFormats, service.maxTextureSize || DEFAULT_MAX_TEXTURE_SIZE).load(url, arraybuffer, 0, 0, { maxTextureSize: service.maxTextureSize || DEFAULT_MAX_TEXTURE_SIZE });
            promise.then(tile => {
                const { content: cmpt, transferables } = this._processCMPT(tile, params);
                this._createCMPTMissedAttrs(cmpt, service);
                if (ifCompressGeometry(service)) {
                    this._compressCMPTContent(cmpt);
                }
                cb(null, cmpt, transferables);
            }).catch(err => {
                cb(err);
            });
        } else if (magic === 'gltf') {
            if (!this._decoders) {
                this._decoders = getTranscoders();
            }
            const rootPath = url.substring(0, url.lastIndexOf('/'));
            const gltfContent = arraybuffer instanceof ArrayBuffer && { buffer: arraybuffer, byteOffset: 0, byteLength: arraybuffer.byteLength } || arraybuffer;
            let loader;
            try {
                loader = new GLTFLoader(rootPath, gltfContent, {
                    transferable: true,
                    requestImage: this._bindedRequestImage,
                    decoders: this._decoders,
                    supportedFormats: this._supportedFormats,
                    maxTextureSize: service.maxTextureSize || DEFAULT_MAX_TEXTURE_SIZE
                });
            } catch (e) {
                cb(e);
            }

            loader.load({ skipAttributeTransform: false }).then(gltf => {
                gltf.url = url;
                this._processGLTF(gltf, null, params);
                if (service.createNormalIfMissed) {
                    this._createGLTFMissedAttrs(gltf);
                }
                if (ifCompressGeometry(service)) {
                    this._compressAttrFloat32ToInt16(gltf);
                }
                cb(null, { magic: 'gltf', gltf }, loader.transferables);
            });
        } else {
            cb(new Error('unsupported tile format: ' + magic));
        }
    }

    _createCMPTMissedAttrs(cmpt, service) {
        if (cmpt.content) {
            cmpt.content.forEach(contentItem => {
                this._createCMPTMissedAttrs(contentItem, service);
            });
        } else {
            if (service.createNormalIfMissed) {
                this._createGLTFMissedAttrs(cmpt.gltf);
            }
        }
    }

    _compressCMPTContent(cmpt) {
        if (cmpt.content) {
            cmpt.content.forEach(contentItem => {
                this._compressCMPTContent(contentItem);
            });
        } else {
            this._compressAttrFloat32ToInt16(cmpt.gltf);
        }
    }

    _createMissedAttrs(primitive, gltf) {
        if (!this._needCreateMissedAttrs(primitive, gltf)) {
            return;
        }
        if (!primitive.attributes['NORMAL']) {
            const array = primitive.attributes['POSITION'].array;
            const count = array.length;
            const positions = this._is4326() ? POS_FOR_NORMAL.subarray(0, count) : array;
            const indices = primitive.indices.array;
            const normals = buildNormals(positions, indices, new Float32Array(positions.length));
            primitive.attributes['NORMAL'] = {
                array: normals,
                byteLength: normals.byteLength,
                byteOffset: 0,
                byteStride: 0,
                componentType: 5126,
                count: normals.length / 3,
                itemSize: 3,
                name: 'NORMAL',
                type: 'VEC3'
            };
            // const tangents = buildTangents(
            //     positions,
            //     normals,
            //     texCoordAttr.array,
            //     indices,
            //     new Float32Array(positions.length / 3 * 4)
            // );
            // primitive.attributes['TANGENT'] = {
            //     array: tangents,
            //     byteLength: tangents.byteLength,
            //     byteOffset: 0,
            //     byteStride: 0,
            //     componentType: 5126,
            //     count: tangents.length / 4,
            //     itemSize: 4,
            //     name: 'TANGENT',
            //     type: 'VEC4'
            // };
            // delete primitive.attributes['TEXCOORD_0'];
        }
    }

    _compressAttrFloat32ToInt16(gltf) {
        //采用KHR_techniques_webgl的模型是自定义shader，这里不做压缩处理
        if (!gltf || !gltf.meshes || (gltf.extensionsUsed && gltf.extensionsUsed.indexOf('KHR_techniques_webgl') > -1)) {
            return;
        }
        // 如果开启sharePosition，会造成tokyo.html爆内存，无法正常加载模型
        if (gltf.asset && gltf.asset.sharePosition) {
            return;
        }
        const meshes = gltf.meshes;
        for (const primitiveIndex in meshes) {
            const primitives = meshes[primitiveIndex].primitives;
            primitives.forEach(primitive => {
                // this._createMissedAttrs(primitive, gltf);
                primitive.compressed_int16_params = {};
                const attributes = primitive.attributes;
                for (const attrName in attributes) {
                    if (NEED_COMPRESSED_ATTR[attrName] &&
                        attributes[attrName].array &&
                        attributes[attrName].array instanceof Float32Array) {
                        let compressed_ratio = 1;
                        if (this._is4326() && attrName === 'POSITION') {
                            compressed_ratio = RATIO;
                            primitive.compressed_int16_params['compressed_ratio'] = compressed_ratio;
                        }
                        const compressed = float32ToInt16(attributes[attrName].array, compressed_ratio, attributes[attrName].min, attributes[attrName].max, attrName);
                        if (!compressed) {
                            continue;
                        }
                        const { array, range } = compressed;
                        attributes[attrName].componentType = 5124;
                        attributes[attrName].array = array;
                        primitive.compressed_int16_params[attrName] = range;
                    }
                }
            });
        }
    }

    _createGLTFMissedAttrs(gltf) {
        //采用KHR_techniques_webgl的模型是自定义shader，这里不做压缩处理
        if (!gltf || !gltf.meshes || (gltf.extensionsUsed && gltf.extensionsUsed.indexOf('KHR_techniques_webgl') > -1)) {
            return;
        }
        // 如果开启sharePosition，会造成tokyo.html爆内存，无法正常加载模型
        if (gltf.asset && gltf.asset.sharePosition) {
            return;
        }
        const meshes = gltf.meshes;
        for (const primitiveIndex in meshes) {
            const primitives = meshes[primitiveIndex].primitives;
            primitives.forEach(primitive => {
                this._createMissedAttrs(primitive, gltf);
            });
        }
    }

    _compressPNTSFloat32ToInt16(pnts) {
        if (!pnts || !pnts.pnts) {
            return;
        }
        const pntsData = pnts.pnts;
        pnts.compressed_int16_params = {};
        for (const attrName in pntsData) {
            if (NEED_COMPRESSED_ATTR[attrName] &&
                pntsData[attrName].array &&
                pntsData[attrName].array instanceof Float32Array) {
                // const proj = this.options.projection;
                let compressed_ratio = 1;
                if (this._is4326() && attrName === 'POSITION') {
                    compressed_ratio = RATIO;
                    pnts.compressed_int16_params['compressed_ratio'] = compressed_ratio;
                }
                const { array, range } = float32ToInt16(pntsData[attrName].array, compressed_ratio, pntsData[attrName].min, pntsData[attrName].max, attrName);
                pntsData[attrName].array = array;
                pnts.compressed_int16_params[attrName] = range;
            }
        }
    }

    // _readS3M(arraybuffer, url, params, cb) {
    //     // const view = new DataView(arraybuffer);
    //     // let bytesOffset = 0;
    //     // const version = view.getFloat32(bytesOffset, true);
    //     // bytesOffset += Float32Array.BYTES_PER_ELEMENT;
    //     // if(version >= 2.0) {
    //     //     // const unzipSize = view.getUint32(bytesOffset, true);
    //     //     bytesOffset += Uint32Array.BYTES_PER_ELEMENT;
    //     // }

    //     // // const byteSize = view.getUint32(bytesOffset, true);
    //     // bytesOffset += Uint32Array.BYTES_PER_ELEMENT;
    //     // const unzipBuffer = unZip(arraybuffer, bytesOffset);
    //     const service = this.options.services[params.rootIdx];
    //     parseS3M({ buffer: arraybuffer, bytesOffset: 0 }, service.maxTextureSize || DEFAULT_MAX_TEXTURE_SIZE).then(s3mData => {
    //         s3mData.gltf.url = url;
    //         const { content, transferables } = this._processB3DM(s3mData, params);
    //         content.magic = 'b3dm';
    //         if (s3mData.pageLods) {
    //             const children = this._convertPageLoads(s3mData.pageLods);
    //             if (children.length) {
    //                 content.children = children;
    //             }
    //         }
    //         cb(null, content, transferables);
    //     });

    // }

    _convertPageLoads(pageLods) {
        const children = [];
        for (let i = 0; i < pageLods.length; i++) {
            const pageLod = pageLods[i];
            if(!pageLod.childTile) {
                continue;
            }
            // var childResource = resource.getDerivedResource({
            //     url: pageLod.childTile
            // });

            const childTileJson = {
                boundingVolume: {
                    sphere: [pageLod.boundingSphere.center.x, pageLod.boundingSphere.center.y, pageLod.boundingSphere.center.z, pageLod.boundingSphere.radius]
                },
                content: {
                    uri: pageLod.childTile
                },
                geometricError: pageLod.boundingSphere.radius / pageLod.rangeList * 16,
                refine: "REPLACE"
            };
            children.push(childTileJson);
            // var childTile = new Cesium3DTile(tile.tileset, childResource, childTileJson, tile);
        }
        return children;
    }

    _checkAndConvert(rootIdx, json, arraybuffer, url, cb) {
        /*if (json.dataType && json.position) {
            // S3M
            cb(null, convertS3MJSON(json));
            return;
        } else */
        if (json.capabilities) {
            cb(null, json);
            // parseI3SJSON(json, url, rootIdx, this._i3sNodeCache[rootIdx], this._fnFetchNodepages).then(tileset => {
            //     cb(null, tileset);
            // });
            return;
        } else {
            cb(null, json);
            return;
        }
    }


    // _checkAndConvertS3MXML(xmlSource) {
    //     return convertS3MXML(xmlSource);
    // }


    _processCMPT(tile, params) {
        const { tiles } = tile;
        const cmpt = { magic: 'cmpt', content: [] };
        const tileTransferables = [];
        for (let i = 0; i < tiles.length; i++) {
            const { magic } = tiles[i];
            if (magic === 'b3dm') {
                const { content, transferables } = this._processB3DM(tiles[i], params);
                pushTransferables(tileTransferables, transferables);
                cmpt.content.push(content);
            } else if (magic === 'i3dm') {
                const { transform, rootIdx } = params;
                const { content, transferables } = this._loadI3DM(tiles[i], transform, rootIdx);
                pushTransferables(tileTransferables, transferables);
                cmpt.content.push(content);
            } else if (magic === 'pnts') {
                const { transform, rootIdx } = params;
                const { content, transferables } = this._loadPNTS(tiles[i], transform, rootIdx);
                pushTransferables(tileTransferables, transferables);
                cmpt.content.push(content);
            } else if (magic === 'cmpt') {
                const { content, transferables } = this._processCMPT(tiles[i], params);
                pushTransferables(tileTransferables, transferables);
                cmpt.content.push(content);
            }
        }
        return {
            content: cmpt,
            transferables: tileTransferables
        };
    }

    _processB3DM(b3dm, params) {
        const { gltf, transferables, featureTable } = b3dm;
        this._processGLTF(gltf, featureTable, params);

        delete b3dm.transferables;
        return {
            content: b3dm, transferables
        };
    }

    _processGLTF(gltf, featureTable, params) {
        const isSharePosition = ifSharingPosition(gltf);
        this._markTextures(gltf);
        const service = params.service;
        if (!service.createNormalIfMissed) {
            this._markUnlit(gltf);
        }
        if (!gltf.asset) {
            gltf.asset = {};
        }
        if (!isSharePosition) {
            this._projectCoordinates(gltf, featureTable, params.upAxis, params.transform);
        } else {
            // 如果position是共享的，不能用把坐标转为投影坐标的方式载入，还是只能用enuToFixedFrame的方式载入
            gltf.asset.sharePosition = true;
            this._convertCoordinates(gltf, featureTable, params.upAxis, params.transform);
        }
    }

    _loadI3DM(content, transform, rootIdx) {
        const { featureTable } = content;
        const data = content.i3dm;
        const rtcCenter = featureTable && featureTable['RTC_CENTER'] || [0, 0, 0];

        // if (featureTable['EAST_NORTH_UP'] && !data['NORMAL_UP'] && !data['NORMAL_UP_OCT32P']) {
        //     // 3 * 3 rotation matrix
        //     const instanceRotation = new Float32Array(data.POSITION.array.length * 3);
        //     const vertexRotMat = [];
        //     const vertexRotMa3 = [];
        //     const v = [];
        //     // create east north up normals
        //     iterateBufferData(data.POSITION, (vertex, idx) => {
        //         vec3.add(v, vertex, rtcCenter);
        //         eastNorthUpToFixedFrame(
        //             v,
        //             null,
        //             vertexRotMat
        //         );
        //         mat3.fromMat4(vertexRotMa3, vertexRotMat);
        //         const vertexMat3 = instanceRotation.subarray(idx * 9, (idx + 1) * 9);
        //         mat3.copy(vertexMat3, vertexRotMa3);
        //     });
        //     data['INSTANCE_ROTATION'] = {
        //         byteStride: 0,
        //         byteOffset: 0,
        //         itemSize: 9,
        //         componentType: 5126,
        //         array: instanceRotation
        //     };
        //     content.transferables.push(instanceRotation.buffer);
        // }

        const projection = this.options['projection'];
        const isTransformIdentity = transform && mat4.exactEquals(IDENTITY_MATRIX, transform);

        const minmax = {
            xmin: Infinity,
            xmax: -Infinity,
            ymin: Infinity,
            ymax: -Infinity,
            hmin: Infinity,
            hmax: -Infinity
        };
        findMinMaxOfPosition(data.POSITION.array, 3, rtcCenter, IDENTITY_MATRIX, minmax);
        const modelCenter = getCenterOfMinMax(minmax);
        if (transform && !isTransformIdentity) {
            vec3.transformMat4(modelCenter, modelCenter, transform);
        }
        const rtcCoord = this._getCoordiate(modelCenter);
        const projCenter = [];
        project(projCenter, rtcCoord, projection);
        projCenter[2] = rtcCoord[2];

        const newRtcCenter = vec3.copy([], modelCenter);

        const cartesian = [0, 0, 0];
        const degree = [0, 0, 0];
        const proj = [0, 0];
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];
        iterateBufferData(data.POSITION, (vertex) => {
            cartesian[0] = vertex[0] + rtcCenter[0];
            cartesian[1] = vertex[1] + rtcCenter[1];
            cartesian[2] = vertex[2] + rtcCenter[2];

            if (transform && !isTransformIdentity) {
                vec3.transformMat4(cartesian, cartesian, transform);
            }
            if (vec3.len(cartesian) === 0) {
                vec3.set(degree, 0, 0, -6378137);
            } else {
                cartesian3ToDegree(degree, cartesian);
            }
            project(proj, degree, projection);

            vertex[0] = proj[0] - projCenter[0];
            vertex[1] = proj[1] - projCenter[1];
            vertex[2] = degree[2] - projCenter[2];

            if (vertex[0] < min[0]) min[0] = vertex[0];
            if (vertex[1] < min[1]) min[1] = vertex[1];
            if (vertex[2] < min[2]) min[2] = vertex[2];
            if (vertex[0] > max[0]) max[0] = vertex[0];
            if (vertex[1] > max[1]) max[1] = vertex[1];
            if (vertex[2] > max[2]) max[2] = vertex[2];
        });
        data.POSITION.min = min;
        data.POSITION.max = max;

        if (transform) {
            vec3.transformMat4(modelCenter, modelCenter, transform);
        }

        content.rtcCenter = newRtcCenter;
        // content.instanceCenter = modelCenter;
        content.rtcCoord = rtcCoord;
        content.projCenter = projCenter;
        content.rootIdx = rootIdx;
        const transferables = content.transferables;
        delete content.transferables;
        return {
            content,
            transferables
        };
    }

    _loadPNTS(content, transform, rootIdx) {
        const { featureTable } = content;
        const data = content.pnts;
        const rtcCenter = featureTable && featureTable['RTC_CENTER'] || [0, 0, 0];
        const projection = this.options['projection'];

        const isTransformIdentity = transform && mat4.exactEquals(IDENTITY_MATRIX, transform);

        const minmax = {
            xmin: Infinity,
            xmax: -Infinity,
            ymin: Infinity,
            ymax: -Infinity,
            hmin: Infinity,
            hmax: -Infinity
        };
        findMinMaxOfPosition(data.POSITION.array, 3, rtcCenter, transform, minmax);
        const modelCenter = getCenterOfMinMax(minmax);
        const projCenter = this._getProjCenter(modelCenter);
        const newRtcCenter = vec3.copy([], modelCenter);
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];

        let cartesian = [0, 0, 0, 1];
        const degree = [0, 0, 0],
            proj = [0, 0];
        iterateBufferData(data.POSITION, (vertex) => {
            cartesian[0] = vertex[0] + rtcCenter[0];
            cartesian[1] = vertex[1] + rtcCenter[1];
            cartesian[2] = vertex[2] + rtcCenter[2];

            if (transform && !isTransformIdentity) {
                cartesian = vec3.transformMat4(cartesian, cartesian, transform);
            }

            if (vec3.len(cartesian) === 0) {
                vec3.set(degree, 0, 0, -6378137);
            } else {
                cartesian3ToDegree(degree, cartesian);
            }
            project(proj, degree, projection);
            // height = cartesian[2] ? projMeter(degree, proj, degree[2], projection) : 0;

            vertex[0] = proj[0] - projCenter[0];
            vertex[1] = proj[1] - projCenter[1];
            vertex[2] = degree[2] - projCenter[2];
            // array[i] = proj[0];
            // array[i + 1] = proj[1];
            // if (itemSize > 2) {
            //     array[i + 2] = height;
            // }
            if (vertex[0] < min[0]) {
                min[0] = vertex[0];
            }
            if (vertex[1] < min[1]) {
                min[1] = vertex[1];
            }
            if (vertex[2] < min[2]) {
                min[2] = vertex[2];
            }

            if (vertex[0] > max[0]) {
                max[0] = vertex[0];
            }
            if (vertex[1] > max[1]) {
                max[1] = vertex[1];
            }
            if (vertex[2] > max[2]) {
                max[2] = vertex[2];
            }
            return vertex;
        });
        data.POSITION.min = min;
        data.POSITION.max = max;

        if (transform) {
            vec3.transformMat4(modelCenter, modelCenter, transform);
        }

        const rtcCoord = this._getCoordiate(modelCenter);

        content.rtcCenter = newRtcCenter;
        // content.instanceCenter = modelCenter;
        content.projCenter = projCenter;
        content.rtcCoord = rtcCoord;
        content.rootIdx = rootIdx;
        const transferables = content.transferables;
        delete content.transferables;
        return {
            content,
            transferables
        };
    }

    // 把纯色的纹理转换成color值，减少纹理读取
    _markTextures(gltf) {
        if (!Array.isArray(gltf.textures)) {
            return;
        }
        const textures = gltf.textures;
        for (let i = 0; i < textures.length; i++) {
            const arr = textures[i] && textures[i].image && textures[i].image.array;
            // arr有可能是ImageBitmap
            if (arr && arr.length) {
                const r = arr[0];
                const g = arr[1];
                const b = arr[2];
                const a = arr[3];
                let isColor = true;
                for (let j = 4; j < arr.length; j += 4) {
                    if (arr[j] !== r || arr[j + 1] !== g || arr[j + 2] !== b || arr[j + 3] !== a) {
                        isColor = false;
                        break;
                    }
                }
                if (isColor) {
                    textures[i].image.color = [r / 255, g / 255, b / 255, a / 255];
                    delete textures[i].image.array;
                }
            }
        }
    }

    _markUnlit(gltf) {
        // 将没有NORMAL数据的gltf标记为unlit
        const meshes = gltf.meshes;
        for (const meshIndex in meshes) {
            const mesh = meshes[meshIndex];
            if (!mesh) {
                continue;
            }
            const primitives = mesh.primitives;
            if (!primitives) {
                continue;
            }
            for (let i = 0; i < primitives.length; i++) {
                if (!primitives[i]) {
                    continue;
                }
                if (!primitives[i].attributes || primitives[i].attributes['NORMAL']) {
                    continue;
                }
                const materialIndex = primitives[i].material;
                if (!isNil(materialIndex)) {
                    const material = gltf.materials[materialIndex];
                    if (!material) {
                        continue;
                    }
                    if (!material.extensions) {
                        material.extensions = {};
                    }
                    material.extensions['KHR_materials_unlit'] = {};
                }
            }
        }
    }

    abortTileLoading(params, cb) {
        const xhr = this._requests[params.url];
        if (Array.isArray(xhr)) {
            for (let i = 0; i < xhr.length; i++) {
                xhr[i].abort();
            }
        } else if (xhr && xhr.abort) {
            xhr.abort();
        }
        delete this._requests[params.url];
        cb(null);
    }

    _getModelCenter(gltf, featureTable, upAxis, transform) {
        const rtcCenter = featureTable && featureTable['RTC_CENTER'] || gltf.extensions && gltf.extensions['CESIUM_RTC'] && gltf.extensions['CESIUM_RTC'].center;
        let upAxisTransform = Y_TO_Z;
        upAxis = upAxis && upAxis.toUpperCase();
        if (upAxis === 'X') {
            upAxisTransform = X_TO_Z;
        } else if (upAxis === 'Z') {
            upAxisTransform = IDENTITY_MATRIX;
        }
        gltf.extensions = gltf.extensions || {};
        if (!gltf.extensions['CESIUM_RTC']) {
            gltf.extensions['CESIUM_RTC'] = {};
        }
        if (rtcCenter) {
            gltf.extensions['CESIUM_RTC'].center = rtcCenter;
        }
        gltf.extensions['MAPTALKS_RTC'] = {};
        const minmax = {
            xmin: Infinity,
            xmax: -Infinity,
            ymin: Infinity,
            ymax: -Infinity,
            hmin: Infinity,
            hmax: -Infinity
        };
        // 因为一些模型的 rtcCenter 距离真正的中心点距离很远，不能用来计算二维偏转矩阵，故仍需遍历模型，计算中心点坐标
        iterateMesh(gltf, mesh => {
            const position = mesh.attributes && mesh.attributes['POSITION'];
            if (!position) {
                return;
            }
            const nodeMatrix = mat4.identity(TMP_NODE_MATRIX);
            if (mesh.matrices) {
                getNodeMatrix(nodeMatrix, mesh.matrices);
            }
            const arr = mesh.attributes['POSITION'].array;
            const itemSize = mesh.attributes['POSITION'].itemSize;
            mat4.multiply(nodeMatrix, upAxisTransform, nodeMatrix);
            if (transform) {
                mat4.multiply(nodeMatrix, transform, nodeMatrix);
            }
            findMinMaxOfPosition(arr, itemSize, rtcCenter || EMPTY_RTCCENTER, nodeMatrix, minmax, mesh.compressUniforms);
        });
        const modelCenter = getCenterOfMinMax(minmax);
        return {
            rtcCenter,
            modelCenter,
            upAxisTransform
        };
    }

    /**
     * Convert coordinates from Cesium ECEF to maptalks world 2d
     * @param {Object} gltf
     */
    _convertCoordinates(gltf, featureTable, upAxis, transform) {
        const { modelCenter, upAxisTransform, rtcCenter } = this._getModelCenter(gltf, featureTable, upAxis);

        const projCenter = this._getProjCenter(modelCenter);
        gltf.extensions['MAPTALKS_RTC'].projCenter = projCenter;
        gltf.extensions['MAPTALKS_RTC'].rtcCoord = gltf.extensions['CESIUM_RTC'].rtcCoord = this._getCoordiate(modelCenter);

        const newRtcCenter = vec3.copy([], modelCenter);

        if (transform) {
            vec3.transformMat4(modelCenter, modelCenter, transform);
        }

        gltf.extensions['CESIUM_RTC'].rtcCoord = this._getCoordiate(modelCenter);

        if (!rtcCenter) {
            // 没有 rtcCenter 时，需要自己计算一个rtcCenter，否则模型无法正确绘制
            iterateMesh(gltf, primitive => {
                if (primitive.attributes && primitive.attributes['POSITION']) {
                    const vertices = primitive.attributes['POSITION'];
                    if (vertices.array.buffer.projected && vertices.array.buffer.projected[vertices.byteOffset]) {
                        return;
                    }
                    const nodeMatrix = mat4.identity(TMP_NODE_MATRIX);
                    if (primitive.matrices) {
                        getNodeMatrix(nodeMatrix, primitive.matrices);
                    }
                    mat4.multiply(nodeMatrix, upAxisTransform, nodeMatrix);
                    const invNodeMat = mat4.invert(TMP_INV_MATRIX, nodeMatrix);

                    // 根据规范定义：
                    // 新的端点值等于 (vertex * nodeMatrix + rtcCenter - newRtcCenter) * invNodeMatrix
                    // https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/Batched3DModel#coordinate-system
                    const min = [Infinity, Infinity, Infinity];
                    const max = [-Infinity, -Infinity, -Infinity];
                    iterateBufferData(vertices, (vertex) => {
                        vec3.transformMat4(vertex, vertex, nodeMatrix);
                        vertex[0] = vertex[0] - newRtcCenter[0];
                        vertex[1] = vertex[1] - newRtcCenter[1];
                        vertex[2] = vertex[2] - newRtcCenter[2];
                        vec3.transformMat4(vertex, vertex, invNodeMat);
                        if (vertex[0] < min[0]) min[0] = vertex[0];
                        if (vertex[1] < min[1]) min[1] = vertex[1];
                        if (vertex[2] < min[2]) min[2] = vertex[2];
                        if (vertex[0] > max[0]) max[0] = vertex[0];
                        if (vertex[1] > max[1]) max[1] = vertex[1];
                        if (vertex[2] > max[2]) max[2] = vertex[2];
                    });
                    vertices.min = min;
                    vertices.max = max;
                    if (!vertices.array.buffer.projected) {
                        vertices.array.buffer.projected = {};
                    }
                    vertices.array.buffer.projected[vertices.byteOffset] = 1;
                }
            });
            gltf.extensions['CESIUM_RTC'].center = newRtcCenter;
        }
    }

    /**
     * Convert coordinates from Cesium ECEF to maptalks world 2d
     * @param {Object} gltf
     */
    _projectCoordinates(gltf, featureTable, upAxis, transform) {
        const { modelCenter: center, rtcCenter } = this._getModelCenter(gltf, featureTable, upAxis, transform);
        const projCenter = this._getProjCenter(center);
        // gltf.extensions['CESIUM_RTC'] = { center, projCenter };
        gltf.extensions['MAPTALKS_RTC'].projCenter = projCenter;
        gltf.extensions['MAPTALKS_RTC'].rtcCoord = gltf.extensions['CESIUM_RTC'].rtcCoord = this._getCoordiate(center);

        iterateMesh(gltf, primitive => {
            if (primitive.attributes && primitive.attributes['POSITION']) {
                const needCreateNormal = this._needCreateMissedAttrs(primitive, gltf);
                if (needCreateNormal) {
                    const length = primitive.attributes['POSITION'].array.length;
                    if (!POS_FOR_NORMAL || POS_FOR_NORMAL.length < length) {
                        POS_FOR_NORMAL = new Float32Array(length);
                    }
                }
                if (primitive.attributes['NORMAL']) {
                    this._transformNormalOrTangent(primitive.attributes['NORMAL'], primitive.matrices, upAxis);
                }
                if (primitive.attributes['TANGENT']) {
                    this._transformNormalOrTangent(primitive.attributes['TANGENT'], primitive.matrices, upAxis);
                }
                // debugger
                const { newPositions } = this._projVertices(primitive.attributes['POSITION'], primitive.matrices, rtcCenter, gltf.extensions['MAPTALKS_RTC'], upAxis, transform, primitive.compressUniforms, needCreateNormal);
                const { componentType } = primitive.attributes['POSITION'];
                if (componentType !== 5126) {
                    primitive.attributes['POSITION'].array = new Float32Array(newPositions);
                }
            }
        });

        // node的matrix已经在projVertices时都计算到新的端点值中了
        // 所以这里都重置为identity matrix
        for (const p in gltf.nodes) {
            const node = gltf.nodes[p];
            node.matrix = IDENTITY_MATRIX;
        }
    }

    _getProjCenter(center) {
        const projection = this.options['projection'];
        if (projection === 'identity') {
            vec3.copy(TEMP_DEGREE, center);
        } else if (vec3.len(center) === 0) {
            vec3.set(TEMP_DEGREE, 0, 0, -6378137);
        } else {
            cartesian3ToDegree(TEMP_DEGREE, center);
        }

        project(TEMP_PROJ, TEMP_DEGREE, projection);
        // const height = center.length > 2 ? projMeter(TEMP_DEGREE, TEMP_PROJ, TEMP_DEGREE[2], projection) : 0;
        const height = TEMP_DEGREE[2];
        const projCenter = [];
        projCenter[0] = TEMP_PROJ[0];
        projCenter[1] = TEMP_PROJ[1];
        projCenter[2] = height;
        return projCenter;
    }

    _transformNormalOrTangent(datas, matrices, upAxis) {
        let matrix;
        if (upAxis === 'Y') {
            matrix = Y_TO_Z;
        } else if (upAxis === 'X') {
            matrix = X_TO_Z;
        } else {
            matrix = IDENTITY_MATRIX;
        }
        const m = mat4.copy([], matrix);
        getNodeMatrix(m, matrices);
        if (mat4.exactEquals(m, IDENTITY_MATRIX)) {
            return;
        }
        const normalMatrix = mat3.fromMat4([], m);
        const n = [];
        iterateBufferData(datas, (item) => {
            vec3.transformMat3(n, item, normalMatrix);
            vec3.normalize(n, n);
            vec3.copy(item, n);
            return n;
        });
    }
    // 将模型顶点的ecef坐标转换为map的投影坐标
    _projVertices(vertices, matrices, rtcCenter, maptalksRTC, upAxis, transform, compressUniforms, needCreateNormal) {
        // 多个primitive可能共享同一个POSITION，此时只需要遍历一次
        // 例子: Batched/BatchedColors
        if (vertices.array.buffer.projected && vertices.array.buffer.projected[vertices.byteOffset]) {
            return null;
        }
        const nodeMatrix = mat4.identity([]);
        getNodeMatrix(nodeMatrix, matrices);
        const projection = this.options['projection'];
        upAxis = upAxis && upAxis.toUpperCase();
        const cesiumCenter = rtcCenter;
        // const maptalksCenter = maptalksRTC && maptalksRTC.center;
        let upAxisTransform = null;
        if (upAxis === 'Y') {
            upAxisTransform = Y_TO_Z;
        } else if (upAxis === 'X') {
            upAxisTransform = X_TO_Z;
        }
        // upAxisTransform = Y_UP_TO_Z_UP;

        let cartesian = [0, 0, 0, 1];
        const degree = [0, 0, 0],
            proj = [0, 0];
        const projCenter = maptalksRTC.projCenter;

        const proj3857Center = project([], maptalksRTC.rtcCoord, 'EPSG:3857');

        const isTransformIdentity = transform && mat4.exactEquals(IDENTITY_MATRIX, transform);
        // debugger
        // let projPosition = new Array(array.length);
        // let max = 0;
        const min = vertices.min = vertices.min || [];
        const max = vertices.max = vertices.max || [];
        vec3.set(min, Infinity, Infinity, Infinity);
        vec3.set(max, -Infinity, -Infinity, -Infinity);
        const uniforms = compressUniforms || {};
        const { decode_position_min, decode_position_normConstant } = uniforms;
        let pos_min = [0, 0, 0, 0], pos_normConstant = 1;
        if (decode_position_min) {
            pos_min = decode_position_min;
        }
        if (decode_position_normConstant) {
            pos_normConstant = decode_position_normConstant;
        }
        const newPositions = [];
        iterateBufferData(vertices, (vertex, index) => {
            cartesian[0] = vertex[0] * pos_normConstant + pos_min[0];
            cartesian[1] = vertex[1] * pos_normConstant + pos_min[1];
            cartesian[2] = vertex[2] * pos_normConstant + pos_min[2];

            cartesian = vec3.transformMat4(cartesian, cartesian, nodeMatrix);

            if (upAxisTransform) {
                cartesian = vec3.transformMat4(cartesian, cartesian, upAxisTransform);
            }

            if (cesiumCenter) {
                vec3.add(cartesian, cartesian, cesiumCenter);
            }

            if (transform && !isTransformIdentity) {
                cartesian = vec3.transformMat4(cartesian, cartesian, transform);
            }

            if (vec3.len(cartesian) === 0) {
                vec3.set(degree, 0, 0, -6378137);
            } else {
                cartesian3ToDegree(degree, cartesian);
            }
            if (needCreateNormal) {
                const posArray = POS_FOR_NORMAL;
                project(proj, degree, projection);
                posArray[index * 3] = proj[0] - proj3857Center[0];
                posArray[index * 3 + 1] = proj[0] - proj3857Center[1];
                posArray[index * 3 + 2] = proj[0] - proj3857Center[2];
            }
            project(proj, degree, projection);
            // height = cartesian[2] ? projMeter(degree, proj, degree[2], projection) : 0;

            if (vertex instanceof Float32Array) {
                vertex[0] = proj[0] - projCenter[0];
                vertex[1] = proj[1] - projCenter[1];
                vertex[2] = degree[2] - projCenter[2];
            } else {
                const x = proj[0] - projCenter[0];
                const y = proj[1] - projCenter[1];
                const z = degree[2] - projCenter[2];
                if (vertices.componentType !== 5126) {
                    newPositions.push(x);
                    newPositions.push(y);
                    newPositions.push(z);
                    newPositions.push(vertex[3]);
                }
            }
            // array[i] = proj[0];
            // array[i + 1] = proj[1];
            // if (itemSize > 2) {
            //     array[i + 2] = height;
            // }
            if (vertex[0] < min[0]) {
                min[0] = vertex[0];
            }
            if (vertex[1] < min[1]) {
                min[1] = vertex[1];
            }
            if (vertex[2] < min[2]) {
                min[2] = vertex[2];
            }

            if (vertex[0] > max[0]) {
                max[0] = vertex[0];
            }
            if (vertex[1] > max[1]) {
                max[1] = vertex[1];
            }
            if (vertex[2] > max[2]) {
                max[2] = vertex[2];
            }
            return vertex;
        });
        if (!vertices.array.buffer.projected) {
            vertices.array.buffer.projected = {};
        }
        vertices.array.buffer.projected[vertices.byteOffset] = 1;
        //TODO 100适用于3857和baidu投影，4326投影需要选用别的值
        // const ArrayType = getPosArrayType(max * 100);
        // projPosition = new ArrayType(projPosition);
        return {
            projCenter,
            newPositions
        };
    }

    _getCoordiate(cart3) {
        if (vec3.len(cart3) === 0) {
            return vec3.set([], 0, 0, -6378137);
        } else {
            return cartesian3ToDegree([], cart3);
        }
    }

    onRemove() {
        //nothing need to do now
    }

    _is4326() {
        return this.options.projection === 'EPSG:4326' || this.options.projection === 'EPSG:4490';
    }

    _needCreateMissedAttrs(primitive, gltf) {
        if (!primitive.attributes['POSITION'] || isUnlit(primitive, gltf)) {
            return false;
        }
        const tangentAttr = primitive.attributes['TANGENT'];
        if (tangentAttr) {
            return false;
        }
        // const texCoordAttr = primitive.attributes['TEXCOORD_0'];
        // if (!texCoordAttr) {
        //     return false;
        // }
        return true;
    }

}

function readString(buffer, offset, length) {
    if (textDecoder) {
        const arr = new Uint8Array(buffer, offset, length);
        return textDecoder.decode(arr);
    } else {
        const arr = new Uint8Array(buffer, offset, length);
        return stringFromUTF8Array(arr);
    }
}

// function convertStrideArr(buffer, byteOffset, stride, itemSize, count, componentType) {
//     const ctor = GLTFLoader.getTypedArrayCtor(componentType);
//     const newArr = new ctor(count * itemSize);
//     return GLTFLoader.readInterleavedArray(newArr, buffer, count, itemSize, stride, byteOffset, componentType);
// }

const vertex = [];
function findMinMaxOfPosition(arr, itemSize, rtcCenter, nodeMatrix, minmax, compressUniforms) {
    const uniforms = compressUniforms || {};
    const { decode_position_min, decode_position_normConstant } = uniforms;
    let pos_min = [0, 0, 0, 0], pos_normConstant = 1;
    if (decode_position_min) {
        pos_min = decode_position_min;
    }
    if (decode_position_normConstant) {
        pos_normConstant = decode_position_normConstant;
    }
    for (let i = 0, l = arr.length; i < l; i += itemSize) {
        const { xmin, ymin, xmax, ymax, hmin, hmax } = minmax;

        vec3.set(vertex, arr[i] * pos_normConstant + pos_min[0], arr[i + 1] * pos_normConstant + pos_min[1], arr[i + 2] * pos_normConstant + pos_min[2]);

        vec3.transformMat4(vertex, vertex, nodeMatrix);
        const array = vec3.add(vertex, rtcCenter, vertex);
        if (array[0] < xmin) {
            minmax.xmin = array[0];
        }
        if (array[0] > xmax) {
            minmax.xmax = array[0];
        }
        if (array[1] < ymin) {
            minmax.ymin = array[1];
        }
        if (array[1] > ymax) {
            minmax.ymax = array[1];
        }
        if (itemSize > 2) {
            if (array[2] < hmin) {
                minmax.hmin = array[2];
            }
            if (array[2] > hmax) {
                minmax.hmax = array[2];
            }
        }
    }
}

function getCenterOfMinMax(minmax) {
    const { xmax, ymax, xmin, ymin, hmin, hmax} = minmax;
    const center = [(xmin + xmax) / 2, (ymin + ymax) / 2, (hmin + hmax) / 2];
    if (xmax === -Infinity) {
        center[0] = 0;
    }
    if (ymax === -Infinity) {
        center[1] = 0;
    }
    if (hmax === -Infinity) {
        center[2] = 0;
    }
    // console.log(xmin, xmax, ymin, ymax, hmin, hmax);
    // const pos = gltf.meshes[0].primitives[0].attributes['POSITION'];
    // console.log(pos.min, pos.max);
    if (isNaN(center[2])) {
        center[2] = 0;
    }
    return center;
}

function pushTransferables(target, src) {
    for (let i = 0; i < src.length; i++) {
        if (target.indexOf(src[i]) < 0) {
            target.push(src[i]);
        }
    }
}

function ifSharingPosition(gltf) {
    if (!gltf || !gltf.meshes) {
        return false;
    }
    // 有 KHR_techniques_webgl 的模型可能在shader中有顶点计算逻辑，所以不能对顶点进行额外处理和计算
    if (gltf.extensions && gltf.extensions['KHR_techniques_webgl']) {
        return true;
    }
    const visitStamp = 'visited';
    let visitId = 1;
    const buffers = [];
    for (const i in gltf.meshes) {
        const mesh = gltf.meshes[i];
        const { primitives } = mesh;
        if (!primitives) {
            continue;
        }
        for (let j = 0; j < primitives.length; j++) {
            const position = primitives[j].attributes && primitives[j].attributes['POSITION'];
            if (!position || !position.array) {
                continue;
            }
            if (!position.array.buffer[visitStamp]) {
                position.array.buffer[visitStamp] = visitId++;
            }
            const key = (visitId - 1) + '-' + (position.byteOffset || 0);
            if (buffers.indexOf(key) >= 0) {
                return true;
            }
            buffers.push(key);
        }
    }
    return false;
}

function getNodeMatrix(out, matrices) {
    // const nodeMatrix = mat4.identity(out);
    const nodeMatrix = out;
    // for (let i = 0; i < matrices.length; i++) {
    for (let i = matrices.length - 1; i >= 0; i--) {
        mat4.multiply(nodeMatrix, matrices[i], nodeMatrix);
    }
    return nodeMatrix;
}

function float32ToInt16(inputArray, compressed_ratio, min, max, name) {
    if (compressed_ratio && compressed_ratio > 1) {//compressed_ratio为1时不需要遍历
        for (let i = 0; i < inputArray.length; i++) {
            if ((i + 1) % 3 != 0) { //x,y弧度转为米
                inputArray[i] *= compressed_ratio;
            }
        }
    }
    let minElement, maxElement;
    if (min && max && compressed_ratio === 1) {//存在min, max则直接使用
        minElement = Math.min(...min);
        maxElement = Math.max(...max);
    } else {
        const { min, max } = findMinMax(inputArray);
        minElement = min;
        maxElement = max;
    }
    if (!checkError(inputArray, minElement, maxElement, name) && COMPRESSED_ERROR[name]) {
        // console.warn(`${name} is not compressed!`);
        return null;
    }
    return encodeFloat32(inputArray, minElement, maxElement);
}
//检查压缩与解压后的误差
function checkError(inputArray, minElement, maxElement, name) {
    for(let i = 0; i < inputArray.length; i++) {
        const enValue = encodeValue(inputArray[i], minElement, maxElement);
        const deValue = decodeFloat32(enValue, minElement, maxElement);
        if (Math.abs(deValue - inputArray[i]) > COMPRESSED_ERROR[name]) {
            return false;
        }
    }
    return true;
}

function decodeFloat32(value, min, max) {
    const v = (value >= 32768.0) ? -(65536.0 - value) / 32768.0 : value / 32767.0;
    return (v + 1.0) * (max -min) / 2.0 + min;
}

function encodeFloat32(array, min, max) {
    const output = new Int16Array(array.length);
    for(let i = 0; i < array.length; i++) {
        output[i] = encodeValue(array[i], min, max);
    }
    return  { array: output, range: [min, max] };
}

function encodeValue(value, min, max) {
    const normalizeValue = (value - min) * 2 / (max - min) -1;
    const s = Math.max(-1, Math.min(1, normalizeValue)); //[-1, 1]
    return s < 0 ? s * 0x8000 : s * 0x7FFF;
}

function findMinMax(array) {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < array.length; i++) {
        if (array[i] > max) {
            max = array[i];
        }
        if (array[i] < min) {
            min = array[i];
        }
    }
    return { min , max };
}

function isUnlit(primitive, gltf) {
    const material = gltf.materials[primitive.material];
    const isUnlit = material && material.extensions && material.extensions['KHR_materials_unlit'];
    return isUnlit;
}

function ifCompressGeometry(service) {
    return service.compressGeometry === undefined || service.compressGeometry;
}
