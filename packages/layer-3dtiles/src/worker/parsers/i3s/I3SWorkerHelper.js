import { isObject } from '../../../common/Util';
import { getComponentType } from '../../../common/TileHelper';
import { getGLTFLoaderBundle } from '@maptalks/gl/dist/transcoders.js';
import { vec3, mat4 } from 'gl-matrix';
import transcoders from '../../../loaders/transcoders.js';
import parseDDS from 'parse-dds';
// import parseDDS from './DDSParser';
import { iterateBufferData } from '../../../common/GLTFHelpers';
import { project } from '../../Projection';

const { Ajax } = getGLTFLoaderBundle();

const IDENTITY_MATRIX = mat4.identity([]);
const DRACO = transcoders().draco;
const KTX2 = transcoders().ktx2;
// import { binarizeGLTF, binarizeB3DM } from '../../../common/GLTFHelpers';

const DEFAULT_MATERIAL = {
    "pbrMetallicRoughness": {
        "baseColorFactor": [
            0.5,
            0.5,
            0.5,
            1.0
        ],
        "metallicFactor": 0,
        "roughnessFactor": 0.5,
    }
};

const COMPRESSED_ATTRIBUTES = {
    'position': {
        name: 'POSITION',
        accessor: {
            "componentType": 5126,
            "type": "VEC3"
        }
    },
    "normal": {
        name: 'NORMAL',
        accessor: {
            "componentType": 5126,
            "type": "VEC3"
        }
    },
    "uv0": {
        name: 'TEXCOORD_0',
        accessor: {
            "componentType": 5126,
            "type": "VEC2"
        }
    },
    "color": {
        name: 'COLOR_0',
        accessor: {
            "componentType": 0x1401,
            "type": "VEC4"
        }
    },
    "uv-region": {
        name: 'uvRegion',
        accessor: {
            "componentType": 0x1403,
            "type": "VEC4",
        }
    },
    "feature-index": {
        name: '_BATCHID',
        accessor: {
            // 文档中是不存在的 Uint64 类型
            "componentType": 0x1405,
            "type": "SCALAR"
        }
    },
    "faceRange": {
        name: 'faceRange',
        accessor: {
            "componentType": 0x1405,
            "type": "VEC2"
        }

    },
};

export function isI3SURL(url) {
    return url.indexOf('i3s:') >= 0;
}

export function loadI3STile(i3sInfo, supportedFormats, projection, dataProjection, maxTextureSize, fetchOptions) {
    const promises = [];
    const texCount = [];
    const xhrs = [];
    for (let i = 0; i < i3sInfo.meshes.length; i++) {
        const { geometry, material } = i3sInfo.meshes[i];
        const ajax = Ajax.getArrayBuffer(geometry.url, fetchOptions);
        ajax.xhr.url = geometry.url;
        xhrs.push(ajax.xhr);
        const promise = ajax.then(buffer => { return { buffer };});
        promises.push(promise);

        const requests = [];
        fillTextureRequests(material, requests);
        if (requests.length) {
            const texturePromises = requests.map(req => {
                const ajax = Ajax.getArrayBuffer(req.url, fetchOptions);
                ajax.xhr.url = req.url;
                xhrs.push(ajax.xhr);
                return ajax.then(buffer => {
                    if (buffer && buffer.status) {
                        return null;
                    }
                    return { buffer, mimeType: req.mimeType, format: req.format };
                });
            });
            promises.push(...texturePromises);
        }
        texCount[i] = requests.length;
    }
    const loadPromise = Promise.all(promises).then(binaries => {
        for (let i = 0; i < binaries.length; i++) {
            if (!binaries[i] || !binaries[i].buffer) {
                //aborted
                return Promise.resolve(null);
            }
        }
        const bins = [];
        let index = 0;
        for (let i = 0; i < texCount.length; i++) {
            const count = texCount[i];
            bins.push({
                geoBuffer: { data: binaries[index].buffer.data },
                textureBuffers: binaries.slice(index + 1, count + index + 1).map(buf => {
                    return {
                        data: buf.buffer.data,
                        mimeType: buf.mimeType,
                        format: buf.format
                    };
                })
            });
            index += 1 + count;
        }
        const gltf = buildGLTF(i3sInfo, bins, supportedFormats, maxTextureSize, projection, dataProjection);
        return gltf;
    });
    loadPromise.xhr = xhrs;
    return loadPromise;
}

const sampler = {
    // "magFilter": 9729,
    // "minFilter": 9729,
    // "wrapR": 10497,
    // "wrapS": 10497,
    // "wrapT": 10497

    "magFilter": 0x2600,
    "minFilter": 0x2600,
    "wrapR": 0x812F,
    "wrapS": 0x812F,
    "wrapT": 0x812F
};

function buildGLTF(i3sInfo, bins, supportedFormats, maxTextureSize, projection, dataProjection) {
    const gltf = {
        asset: {
            generator: 'i3s',
            version: '2.0'
        },
        extensions: {},
        scene: 0,
        scenes: [{ nodes: [] }],
        nodes: {},
        meshes: {},
        materials: [],
        skins: [],
        animations: null,
        textures: [],
        transferables: []
    };
    const promises = [];
    for (let i = 0; i < i3sInfo.meshes.length; i++) {
        let { material } = i3sInfo.meshes[i];
        const { geometry } = i3sInfo.meshes[i];
        let primPromise;
        const geoBuf = bins[i].geoBuffer.data;
        if (!geoBuf) {
            continue;
        }
        const isDraco = isDracoCompressed(geoBuf);
        if (isDraco) {
            primPromise = buildCompressedPrimitive(gltf, i, geometry, geoBuf, i3sInfo.transform, i3sInfo.center, projection, dataProjection);
        } else {
            primPromise = buildPrimitive(gltf, i, geometry, geoBuf, i3sInfo.transform, i3sInfo.center, projection, dataProjection);
        }
        promises.push(primPromise);
        gltf.nodes[i] = {
            mesh: i,
            nodeIndex: i,
            matrix: mat4.identity([])
        };
        gltf.scenes[0].nodes[i] = gltf.nodes[i];
        if (!material) {
            material = DEFAULT_MATERIAL;
        }
        const matPromise = buildMaterial(i, gltf, material, bins[i].textureBuffers, supportedFormats, maxTextureSize);
        promises.push(matPromise);
    }

    return Promise.all(promises).then(() => {
        return {
            gltf,
            featureTable: {
                BATCH_LENGTH: 0
            },
            transferables: gltf.transferables
        };
    });
}

function buildCompressedPrimitive(gltf, index, geometry, buffer, transform, center, projection, dataProjection) {
    const compressedAttributes = geometry.info.compressedAttributes;
    const attributes = compressedAttributes.attributes.reduce((prevValue, currentValue, idx) => {
        const attr = COMPRESSED_ATTRIBUTES[currentValue];
        if (!attr) {
            return prevValue;
        }
        const name = attr.name || currentValue;
        prevValue[name] = idx;
        return prevValue;
    }, {});
    const dracoOptions = {
        attributes,
        metadatas: {
            'POSITION': [{ name: 'i3s-scale_x', type: 'double' }, { name: 'i3s-scale_y', type: 'double' }]
        },
        useUniqueIDs: false,
        skipAttributeTransform: false
    };
    return DRACO(buffer, dracoOptions).then(data => {
        return buildPrimitiveObject(data, gltf, index, transform, center, projection, dataProjection);
    });
}

const binaryAttributeDecoders = {
    position: function (decodedGeometry, data, offset) {
        const count = decodedGeometry.vertexCount * 3;
        const array = new Float32Array(data, offset, count);
        decodedGeometry.position ={
            array,
            componentType: 5126,
            itemSize: 3,
            count: count / 3,
            meta: {
                'i3s-scale_x': 1,
                'i3s-scale_y': 1,
            },
            type: 'VEC3'
        };
        offset += count * 4;
        return offset;
    },
    normal: function (decodedGeometry, data, offset) {
        const count = decodedGeometry.vertexCount * 3;
        const array = new Float32Array(data, offset, count);
        decodedGeometry.normal = {
            array,
            componentType: 5126,
            itemSize: 3,
            count: count / 3,
            type: 'VEC3'
        };
        offset += count * 4;
        return offset;
    },
    uv0: function (decodedGeometry, data, offset) {
        const count = decodedGeometry.vertexCount * 2;
        const array = new Float32Array(data, offset, count);
        decodedGeometry.uv0 = {
            array,
            componentType: 5126,
            itemSize: 2,
            count: count / 2,
            type: 'VEC2'
        };
        offset += count * 4;
        return offset;
    },
    color: function (decodedGeometry, data, offset) {
        const count = decodedGeometry.vertexCount * 4;
        const array = new Uint8Array(data, offset, count);
        decodedGeometry.color = {
            array,
            componentType: 5121,
            itemSize: 4,
            count: count / 4,
            type: 'VEC4'
        };
        offset += count;
        return offset;
    },
    featureId: function (decodedGeometry, data, offset) {
        //We don't need to use this for anything so just increment the offset
        const count = decodedGeometry.featureCount;
        offset += count * 8;
        return offset;
    },
    id: function (decodedGeometry, data, offset) {
        //We don't need to use this for anything so just increment the offset
        const count = decodedGeometry.featureCount;
        offset += count * 8;
        return offset;
    },
    faceRange: function (decodedGeometry, data, offset) {
        const count = decodedGeometry.featureCount * 2;
        const array = new Uint32Array(data, offset, count);
        decodedGeometry.faceRange = {
            array,
            componentType: 5125,
            itemSize: 2,
            count: count / 2,
            type: 'VEC2'
        };
        offset += count * 4;
        return offset;
    },
    uvRegion: function (decodedGeometry, data, offset) {
        const count = decodedGeometry.vertexCount * 4;
        const array = new Uint16Array(data, offset, count);
        decodedGeometry['uv-region'] = {
            array,
            componentType: 5123,
            itemSize: 4,
            count: count / 4,
            type: 'VEC4'
        };
        offset += count * 2;
        return offset;
    },
    region: function (decodedGeometry, data, offset) {
        const count = decodedGeometry.vertexCount * 4;
        const array = new Uint16Array(data, offset, count);
        decodedGeometry['uv-region'] = {
            array,
            componentType: 5123,
            itemSize: 4,
            count: count / 4,
            type: 'VEC4'
        };
        offset += count * 2;
        return offset;
    },
};


function buildPrimitive(gltf, index, geometry, buffer, transform, center, projection, dataProjection) {
    const decodedGeometry = {
        vertexCount: 0,
    };

    const dataView = new DataView(buffer);

    try {
        let offset = 0;
        decodedGeometry.vertexCount = dataView.getUint32(offset, 1);
        offset += 4;

        decodedGeometry.featureCount = dataView.getUint32(offset, 1);
        offset += 4;

        // 含有ordering时，说明是1.6的数据
        const bufferInfo = geometry.info.ordering ? null : geometry.info;
        if (bufferInfo) {
            const attributes = [];
            for (const attribute in bufferInfo) {
                if (attribute !== "offset" && attribute !== '') {
                    attributes.push(attribute);
                }
            }
            // 1.7 / 1.8
            for (
                let attrIndex = 0;
                attrIndex < attributes.length;
                attrIndex++
            ) {
                if (binaryAttributeDecoders[attributes[attrIndex]]) {
                    offset = binaryAttributeDecoders[attributes[attrIndex]](
                        decodedGeometry,
                        buffer,
                        offset
                    );
                } else {
                    console.error(
                        "Unknown decoder for",
                        attributes[attrIndex]
                    );
                }
            }
        } else {
            const schema = geometry.info;
            let ordering = schema.ordering;
            let featureAttributeOrder = schema.featureAttributeOrder;
            const featureData = null;
            if (
                featureData &&
          featureData.geometryData &&
          featureData.geometryData[0] &&
          featureData.geometryData[0].params
            ) {
                ordering = Object.keys(
                    featureData.geometryData[0].params.vertexAttributes
                );
                featureAttributeOrder = Object.keys(
                    featureData.geometryData[0].params.featureAttributes
                );
            }

            // use default geometry schema
            for (let i = 0; i < ordering.length; i++) {
                const decoder = binaryAttributeDecoders[ordering[i]];
                if (!decoder) {
                    console.log(ordering[i]);
                }
                offset = decoder(decodedGeometry, buffer, offset);
            }

            for (let j = 0; j < featureAttributeOrder.length; j++) {
                const curDecoder = binaryAttributeDecoders[featureAttributeOrder[j]];
                if (!curDecoder) {
                    console.log(featureAttributeOrder[j]);
                }
                offset = curDecoder(decodedGeometry, buffer, offset);
            }
        }
    } catch (e) {
        //console.warn(e);
    }

    decodedGeometry.scale_x = 1;
    decodedGeometry.scale_y = 1;

    const attributeData = {};
    for (const p in decodedGeometry) {
        const name = COMPRESSED_ATTRIBUTES[p] && COMPRESSED_ATTRIBUTES[p].name;
        if (!name) {
            continue;
        }
        attributeData[name] = decodedGeometry[p];
    }


    if (decodedGeometry["faceRange"]) {
        const faceRange = decodedGeometry.faceRange.array;
        const maxIndex = faceRange.length / 2;
        const ctor = getFeatureIndexCtor(maxIndex);
        const featureIndex = new ctor(attributeData.POSITION.array.length / 3);
        for (
            let range = 0;
            range < faceRange.length - 1;
            range += 2
        ) {
            const curIndex = range / 2;
            const rangeStart = faceRange[range];
            const rangeEnd = faceRange[range + 1];
            for (let i = rangeStart; i <= rangeEnd; i++) {
                featureIndex[i * 3] = curIndex;
                featureIndex[i * 3 + 1] = curIndex;
                featureIndex[i * 3 + 2] = curIndex;
            }
        }
        attributeData['_BATCHID'] = {
            componentType: getComponentType(ctor),
            array: featureIndex,
            itemSize: 1,
            count: featureIndex.length,
            type: 'SCALAR'
        };
    }

    return buildPrimitiveObject({ attributes: attributeData }, gltf, index, transform, center, projection, dataProjection);
}

function buildPrimitiveObject(data, gltf, index, transform, center, projection, dataProjection) {
    const primitive = {
        attributes: data.attributes,
        material: index,
        indices: data.indices,
        mode: 4
    };

    // const vertexCount = data.attributes['POSITION'].array.length / 3;
    scalePosition(data.attributes['POSITION']);
    // i3s的坐标是定义在3DSceneLayer里的，默认为经纬度
    const projCenter = projVertices(data.attributes['POSITION'], transform, center, projection, dataProjection);
    // if (data.attributes['TEXCOORD_0'] && data.attributes["uvRegion"]) {
    //     // debugger
    //     cropUVs(
    //         vertexCount,
    //         data.attributes['TEXCOORD_0'].array,
    //         data.attributes["uvRegion"].array
    //     );
    //     delete data.attributes["uvRegion"];
    // }

    gltf.meshes[index] = {
        primitives: [primitive],
        index: index
    };
    gltf.extensions['MAPTALKS_RTC'] = {
        projCenter
    };
    gltf.extensions['CESIUM_RTC'] = {
        rtcCoord: center
    };
    for (const p in data.attributes) {
        addTransferable(gltf.transferables, data.attributes[p].array.buffer);
    }
    if (data.indices) {
        addTransferable(gltf.transferables, data.indices.array.buffer);
    }
    return primitive;
}

function projVertices(vertices, nodeMatrix, rtcCenter, projection, dataProjection) {
    let carto = [0, 0, 0, 1],
        height;
    const proj = [0, 0];
    const projCenter = project([], rtcCenter, projection, dataProjection);
    projCenter[2] = rtcCenter[2];
    const isTransformIdentity = nodeMatrix && mat4.exactEquals(IDENTITY_MATRIX, nodeMatrix);
    iterateBufferData(vertices, (vertex) => {
        carto[0] = vertex[0];
        carto[1] = vertex[1];
        carto[2] = vertex[2];
        if (!isTransformIdentity) {
            carto = vec3.transformMat4(carto, carto, nodeMatrix);
        }

        if (rtcCenter) {
            vec3.add(carto, carto, rtcCenter);
        }

        project(proj, carto, projection, dataProjection);
        height = carto[2];

        vertex[0] = proj[0] - projCenter[0];
        vertex[1] = proj[1] - projCenter[1];
        vertex[2] = height - projCenter[2];

        return vertex;
    });

    return projCenter;
}


function buildMaterial(index, gltf, material, buffers, supportedFormats, maxTextureSize) {
    const converted = buffers.map(buf => {
        return  converToTexture(buf.data, buf.format, buf.mimeType, supportedFormats, maxTextureSize).then(texture => {
            if (texture.image) {
                if (texture.image.array) {
                    addTransferable(gltf.transferables, texture.image.array.buffer);
                } else if (texture.image.mipmap) {
                    for (let i = 0; i < texture.image.mipmap.length; i++) {
                        addTransferable(gltf.transferables, texture.image.mipmap[i].buffer);
                    }
                }
            }
            return texture;
        });
    });
    return Promise.all(converted).then(texImages => {
        _buildMaterial(index, gltf, material, texImages);
    });

}

function _buildMaterial(index, gltf, material, texImages) {
    const mat = JSON.parse(JSON.stringify(material));
    const textures = gltf.textures;
    if (!texImages.ptr) {
        texImages.ptr = 0;
    }
    for (const p in material) {
        if (material[p] && material[p].url) {
            textures.push(texImages[texImages.ptr++]);
            mat[p] = {
                index: textures.length - 1
            };
            if (material[p].factor !== undefined) {
                mat[p].scale = material[p].factor;
            }
        } else if (isObject(material[p])) {
            mat[p] = _buildMaterial(-1, gltf, material[p], texImages);
        }
    }
    if (index >= 0) {
        gltf.materials[index] = mat;
    }
    return mat;
}

// 获取要请求的纹理图片链接
function fillTextureRequests(material, requests) {
    for (const p in material) {
        if (material[p] && material[p].url) {
            requests.push({ url: material[p].url, mimeType: material[p].mimeType, format: material[p].format });
        } else if (isObject(material[p])) {
            fillTextureRequests(material[p], requests);
        }
    }
}

function scalePosition(position) {
    const array = position.array;
    const scaleX = position.meta && position.meta['i3s-scale_x'];
    const scaleY = position.meta && position.meta['i3s-scale_y'];
    if (scaleX && scaleY && (scaleX !== 1 || scaleY !== 1)) {
        for (let i = 0; i < array.length; i += 3) {
            array[i] *= scaleX.value;
            array[i + 1] *= scaleY.value;
        }
    }
}

function converToTexture(buffer, format, mimeType, supportedFormats, maxTextureSize) {
    if (format === 'dds') {
        // debugger
        const dds = parseDDS(buffer);
        // if (dds.length === 1 && dds[0].array) {
        //     dds = dds[0];
        // }
        const mipmap = dds.images.map(image => {
            return new Uint8Array(buffer, image.offset, image.length);
        });
        // 0x83f1是 rgba s3tc dxt1
        // 0x83f3是 rgba s3tc dxt5
        const format = dds.format === 'dxt1' ? 0x83f1 : 0x83f3;
        return Promise.resolve({
            image: {
                mipmap,
                width: dds.shape[0],
                height: dds.shape[1],
                mimeType,
            },
            sampler,
            format
        });
        // return Promise.resolve({
        //     image: dds,
        //     sampler,
        //     format: dds.format
        // })
    } else if (format === 'png' || format === 'jpg') {
        return requestImageOffscreen(buffer, maxTextureSize).then(image => {
            image.mimeType  = mimeType;
            const texture = {
                image,
                sampler,
                // rgba
                format: 0x1908
            };
            return texture;
        });
    } else if (format === 'ktx2') {
        return KTX2(buffer, supportedFormats).then(image => {
            image.mimeType = mimeType;
            return {
                image,
                sampler,
                format: image.format
            };
        });
    }
    return null;
}


let offCanvas, offCtx;
function requestImageOffscreen(arrayBuffer, maxTextureSize) {
    if (!offCanvas) {
        offCanvas = new OffscreenCanvas(2, 2);
        offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    }
    const blob = new Blob([new Uint8Array(arrayBuffer)]);
    return createImageBitmap(blob)
        .then(bitmap => {
            let { width, height } = bitmap;
            if (!isPowerOfTwo(width)) {
                width = floorPowerOfTwo(width);
            }
            if (!isPowerOfTwo(height)) {
                height = floorPowerOfTwo(height);
            }
            const maxSize = maxTextureSize;
            if (maxSize) {
                width = Math.min(maxSize, width);
                height = Math.min(maxSize, height);
            }

            offCanvas.width = width;
            offCanvas.height = height;
            offCtx.drawImage(bitmap, 0, 0, width, height);
            bitmap.close();
            const imgData = offCtx.getImageData(0, 0, width, height);
            return { width, height, array: new Uint8Array(imgData.data) };
        }).catch(() => {
            return { width: 2, height: 2, array: new Uint8Array(4) };
        });
}

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}


function floorPowerOfTwo(value) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}

function addTransferable(transferables, buffer) {
    if (!buffer) {
        return;
    }
    if (transferables.indexOf(buffer) >= 0) {
        return;
    }
    transferables.push(buffer);
}

// function cropUVs(vertexCount, uv0s, uvRegions) {
//     for (var vertexIndex = 0; vertexIndex < vertexCount; ++vertexIndex) {
//         var minU = uvRegions[vertexIndex * 4] / 65535.0;
//         var minV = uvRegions[vertexIndex * 4 + 1] / 65535.0;
//         var scaleU =
//           (uvRegions[vertexIndex * 4 + 2] - uvRegions[vertexIndex * 4]) / 65535.0;
//         var scaleV =
//           (uvRegions[vertexIndex * 4 + 3] - uvRegions[vertexIndex * 4 + 1]) / 65535.0;

//         var u = uv0s[vertexIndex * 2];
//         uv0s[vertexIndex * 2] = (u - Math.floor(u)) * scaleU + minU;

//         var v = uv0s[vertexIndex * 2 + 1];
//         uv0s[vertexIndex * 2 + 1] = (v - Math.floor(v)) * scaleV + minV;
//     }
// }

function isDracoCompressed(data) {
    const magicNumber = new Uint8Array(data, 0, 5);
    return magicNumber[0] === "D".charCodeAt() &&
        magicNumber[1] === "R".charCodeAt() &&
        magicNumber[2] === "A".charCodeAt() &&
        magicNumber[3] === "C".charCodeAt() &&
        magicNumber[4] === "O".charCodeAt();
}

function getFeatureIndexCtor(maxValue) {
    if (maxValue <= 255) {
        return Uint8Array;
    } else if (maxValue <= 65535) {
        return Uint16Array;
    } else {
        return Uint32Array;
    }
}
