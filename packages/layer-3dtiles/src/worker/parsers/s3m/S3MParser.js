import S3MModelParser from './S3MParser-spec.js';
import DXTTextureDecode from './DXTTextureDecode.js';
import { S3MPixelFormat } from './constants';
import decodeBMP from '../BMPDecoder';
import { decompressTexture } from './DDSTexture';
import { getTypedArrayCtor, getComponentType, getAttrType } from '../../../common/TileHelper';
import { isObject } from '../../../common/Util';

const VertexCompressOption = {
    SVC_Vertex : 1,
    SVC_Normal : 2,
    SVC_VertexColor : 4,
    SVC_SecondColor	: 8,
    SVC_TexutreCoord : 16,
    SVC_TexutreCoordIsW	: 32
};
function _fillBMPHeader(buffer,width,height){
    let extraBytes = width%4;
    let rgbSize = height * (4 * width + extraBytes);
    let headerInfoSize = 108;

    /******************header***********************/
    // var flag = "BM";
    let reserved = 0;
    let offset_header = 122;
    let fileSize = rgbSize + offset;
    let planes = 1;
    let bitPP = 32;
    // var compress = 3;
    let hr = 2835;
    let vr = 2835;
    let colors = 0;
    let importantColors = 0;

    let view = new DataView(buffer);
    var offset = 0;
    view.setUint16(offset, 0x4d42, true);offset += 2;
    view.setUint32(offset, fileSize, true);offset += 4;

    view.setUint32(offset, reserved, true);offset += 4;

    view.setUint32(offset, offset_header, true);offset += 4;
    view.setUint32(offset, headerInfoSize, true);offset += 4;
    view.setUint32(offset, width, true);offset += 4;
    view.setUint32(offset, height, true);offset += 4;

    view.setUint16(offset, planes, true);offset += 2;
    view.setUint16(offset, bitPP, true);offset += 2;

    view.setUint32(offset, this.compress, true);offset += 4;

    view.setUint32(offset, rgbSize, true);offset += 4;
    view.setUint32(offset, hr, true);offset += 4;
    view.setUint32(offset, vr, true);offset += 4;

    view.setUint8(offset, colors, true);offset += 4;
    view.setUint32(offset, importantColors, true);offset += 4;

    view.setUint32(offset, 0xff0000, true);offset += 4;
    view.setUint32(offset, 0xff00, true);offset += 4;
    view.setUint32(offset, 0xff, true);offset += 4;
    view.setUint32(offset, 0xff000000, true);offset += 4;
    view.setUint32(offset, 0x57696e20, true);offset += 4;
}

function getCompressedDefines(vertexPackage, defineArr) {
    const defines = {};
    if (vertexPackage.compressOptions) {
        let compressOptions = vertexPackage.compressOptions;
        if((compressOptions & VertexCompressOption.SVC_Vertex) === VertexCompressOption.SVC_Vertex){
            defines['COMPRESS_VERTEX'] = 1;
        }

        if((compressOptions & VertexCompressOption.SVC_Normal) === VertexCompressOption.SVC_Normal){
            defines['COMPRESS_NORMAL'] = 1;
        }

        if((compressOptions & VertexCompressOption.SVC_VertexColor) === VertexCompressOption.SVC_VertexColor){
            defines['COMPRESS_COLOR'] = 1;
        }

        if((compressOptions & VertexCompressOption.SVC_TexutreCoord) === VertexCompressOption.SVC_TexutreCoord){
            defines['COMPRESS_TEXCOORD'] = 1;
        }
    }
    defineArr.push(defines);
}

function obj2arr(obj) {
    if (obj && isObject(obj)) {
        const arr = [];
        for (const o in obj) {
            arr.push(obj[o]);
        }
        return arr;
    } else {
        return obj;
    }
}

function getCompressedUniforms(vertexPackage, uniformsArr) {
    const uniformMap = {};
    const nCompressOptions = vertexPackage.compressOptions;
    if((nCompressOptions & VertexCompressOption.SVC_Vertex) === VertexCompressOption.SVC_Vertex){
        uniformMap['decode_position_min'] = obj2arr(vertexPackage.minVerticesValue);
        
        uniformMap['decode_position_normConstant'] = obj2arr(vertexPackage.vertCompressConstant);
        
    }

    if((nCompressOptions & VertexCompressOption.SVC_Normal) === VertexCompressOption.SVC_Normal){
        uniformMap['normal_rangeConstant'] = obj2arr(vertexPackage.normalRangeConstant);
        
    }

    if((nCompressOptions & VertexCompressOption.SVC_TexutreCoord) === VertexCompressOption.SVC_TexutreCoord){
        if(vertexPackage.texCoordCompressConstant.length > 0){
            uniformMap['decode_texCoord0_min'] = obj2arr(vertexPackage.minTexCoordValue[0]);
            
            uniformMap['decode_texCoord0_normConstant'] = obj2arr(vertexPackage.texCoordCompressConstant[0]);
            
            uniformMap['decode_texCoord0_vNormConstant'] = obj2arr(vertexPackage.texCoordCompressConstant[0]);
            

        }
        if(vertexPackage.texCoordCompressConstant.length > 1){
            uniformMap['decode_texCoord1_min'] = obj2arr(vertexPackage.minTexCoordValue[1]);
            
            uniformMap['decode_texCoord1_normConstant'] = obj2arr(vertexPackage.texCoordCompressConstant[1]);
            
            uniformMap['decode_texCoord1_vNormConstant'] = obj2arr(vertexPackage.texCoordCompressConstant[1]);
            

        }
        if(vertexPackage.texCoordCompressConstant.length > 2){
            uniformMap['decode_texCoord2_min'] = obj2arr(vertexPackage.minTexCoordValue[2]);
            
            uniformMap['decode_texCoord2_normConstant'] = obj2arr(vertexPackage.texCoordCompressConstant[2]);
            
        }
        if(vertexPackage.texCoordCompressConstant.length > 3){
            uniformMap['decode_texCoord3_min'] = obj2arr(vertexPackage.minTexCoordValue[3]);
            
            uniformMap['decode_texCoord3_normConstant'] = obj2arr(vertexPackage.texCoordCompressConstant[3]);
            
        }
        if(vertexPackage.texCoordCompressConstant.length > 4){
            uniformMap['decode_texCoord4_min'] = obj2arr(vertexPackage.minTexCoordValue[4]);
            
            uniformMap['decode_texCoord4_normConstant'] = obj2arr(vertexPackage.texCoordCompressConstant[4]);
            
        }
        if(vertexPackage.texCoordCompressConstant.length > 5){
            uniformMap['decode_texCoord5_min'] = obj2arr(vertexPackage.minTexCoordValue[5]);
            
            uniformMap['decode_texCoord5_normConstant'] = obj2arr(vertexPackage.texCoordCompressConstant[5]);
            
        }
        if(vertexPackage.texCoordCompressConstant.length > 6){
            uniformMap['decode_texCoord6_min'] = obj2arr(vertexPackage.minTexCoordValue[6]);
            
            uniformMap['decode_texCoord6_normConstant'] = obj2arr(vertexPackage.texCoordCompressConstant[6]);
            
        }
        if(vertexPackage.texCoordCompressConstant.length > 7){
            uniformMap['decode_texCoord7_min'] = obj2arr(vertexPackage.minTexCoordValue[7]);
            
            uniformMap['decode_texCoord7_normConstant'] = obj2arr(vertexPackage.texCoordCompressConstant[7]);
            
        }
    }
    uniformsArr.push(uniformMap);
}


S3MModelParser.multiplyByPoint = function(matrix, cartesian, result) {
    let vX = cartesian.x;
    let vY = cartesian.y;
    let vZ = cartesian.z;

    let x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ + matrix[12];
    let y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ + matrix[13];
    let z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ + matrix[14];

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
};

/* eslint-disable no-unused-vars */
export default function parse(data, maxTextureSize) {
    let bytesOffset = data.bytesOffset;
    let result = S3MModelParser.parseBuffer(data.buffer, bytesOffset);
    let geoPackage = result.geoPackage;
    let pageLods = result.groupNode.pageLods;
    let verticesCount;
    let indices;
    let positionsArr = [];
    let positions_4;
    let positions;
    let indexArr = [];
    let uvArr = [];
    let colorArr = [];
    let batchIdArr = [];
    let materialArr = [];
    let definesArr = [];
    let uniformsArr = [];
    let totalVerticesCount = [];
    if (!pageLods[0].geodes[0]) {
        return null;
    }
    let mat = pageLods[0].geodes[0].matrix;
    let textureCodes = [];
    const textureCoordMatrixArr = [];
    let materialsMap = {}
    for(let i = 0; i < result.materials.material.length; i++) {
        materialsMap[result.materials.material[i].material.id] = result.materials.material[i].material;
    }

    let scratchCartesian = {
        x: 0,
        y: 0,
        z: 0
    };
    let indicesCount = 0;
    let minX = Number.MAX_VALUE,
        minY = Number.MAX_VALUE,
        minZ = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE,
        maxY = Number.MIN_VALUE,
        maxZ = Number.MIN_VALUE;
    for(let geoName in geoPackage) {
        let vertexPackage = geoPackage[geoName].vertexPackage;
        verticesCount = vertexPackage.verticesCount;
        let buffer = vertexPackage.vertexAttributes[0].typedArray.buffer;
        let byteOffset = vertexPackage.vertexAttributes[0].typedArray.byteOffset;
        let componentsPerAttribute = vertexPackage.vertexAttributes[0].componentsPerAttribute;
        const componentDatatype = vertexPackage.vertexAttributes[0].componentDatatype;
        const TypedCtor = getTypedArrayCtor(componentDatatype);
        positions = new TypedCtor(buffer,
            vertexPackage.vertexAttributes[0].offsetInBytes + byteOffset,
            verticesCount * componentsPerAttribute);
        // positions = new Float32Array(verticesCount * 3);
        const decode_position_min = obj2arr(vertexPackage.minVerticesValue) || [0, 0, 0];
        
        const decode_position_normConstant = obj2arr(vertexPackage.vertCompressConstant) || 0;
        for(let i = 0; i < verticesCount; i++) {
            let x = positions[i * componentsPerAttribute] * decode_position_normConstant + decode_position_min[0];
            let y = positions[i * componentsPerAttribute + 1] * decode_position_normConstant + decode_position_min[1];
            let z = positions[i * componentsPerAttribute + 2] * decode_position_normConstant + decode_position_min[2];

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            minZ = Math.min(minZ, z);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            maxZ = Math.max(maxZ, z);
        }
        positionsArr.push(positions);
        parseAttrArr('aColor', vertexPackage, buffer, verticesCount, colorArr);
        parseAttrArr('aTexCoord0', vertexPackage, buffer, verticesCount, uvArr);
        parseAttrArr('aTextureCoordMatrix', vertexPackage, buffer, verticesCount, textureCoordMatrixArr);
        parseAttrArr('batchId', vertexPackage, buffer, verticesCount, batchIdArr);
        getCompressedDefines(vertexPackage, definesArr);
        getCompressedUniforms(vertexPackage, uniformsArr);
        // if (vertexPackage.vertexColor) {
        //     colorArr.push(vertexPackage.vertexColor);
        // } else {
        //     colorArr.push(undefined);
        // }

        let indicesTypedArray = geoPackage[geoName].arrIndexPackage[0].indicesTypedArray;
        let indiceItemWidth = indicesTypedArray.byteLength / geoPackage[geoName].arrIndexPackage[0].indicesCount;
        let ctor = indiceItemWidth === 4 ? Uint32Array : indiceItemWidth === 2 ? Uint16Array : Uint8Array;
        indices = new ctor(indicesTypedArray.buffer,
            (geoPackage[geoName].arrIndexPackage[0].bytesOffset || 0) + indicesTypedArray.byteOffset,
            geoPackage[geoName].arrIndexPackage[0].indicesCount);
        indexArr.push(indices);
        indicesCount += indices.length;
        totalVerticesCount.push(verticesCount);

        let materialCode = geoPackage[geoName].arrIndexPackage[0].materialCode;
        materialArr.push(materialsMap[materialCode]);
    }
    let min = [minX, minY, minZ];
    let max = [maxX, maxY, maxZ];
    const s3mVersion = result.version;
    // const gltfMeshPromise = generateGLTFObject(totalVerticesCount, indexArr, positionsArr, null, uvArr, colorArr, batchIdArr, result.texturePackage, mat, min, max, textureCodes, materialArr, maxTextureSize, mat);
    const gltfMeshPromise = generateGLTFObject(totalVerticesCount, indexArr, positionsArr, null, uvArr,textureCoordMatrixArr, colorArr, batchIdArr, result.texturePackage, mat, min, max, textureCodes, materialArr, definesArr, uniformsArr, maxTextureSize, mat, s3mVersion);
    return gltfMeshPromise.then(({ gltf, transferables }) => {
        return {
            gltf,
            featureTable: {
                'BATCH_LENGTH': 0
            },
            transferables,
            pageLods
        }
    });

    // var rawGLTFPromise = generateGLTFBuffer(totalVerticesCount, indexArr, positionsArr, null, uvArr, null, result.texturePackage, mat, min, max, textureCodes, materialArr, maxTextureSize);
    // return rawGLTFPromise.then(function({ rawGLTF, glb }) {
    //     var binaryGLTFData = binarizeGLTF(rawGLTF, glb);
    //     var featureTableJSON = JSON.stringify({
    //         BATCH_LENGTH: 0
    //     });
    //     var batchTableJSON = JSON.stringify({});
    //     var b3dmBuffer = binarizeB3DM(
    //         featureTableJSON,
    //         batchTableJSON,
    //         binaryGLTFData
    //     );

    //     return {
    //         b3dmBuffer: b3dmBuffer,
    //         pageLods: pageLods
    //     };
    // });
}
/* eslint-enable no-unused-vars */


const BMP_HEADER_LENGTH = 122;
let MAX_TEX_SIZE = 0;
let BMP_BUFFER;

function generateGLTFObject(
    allVertexCounts,
    indicesArr,
    positionsArr,
    normalsArr,
    uv0sArr,
    textureCoordMatrixArr,
    colorsArr,
    batchIdArr,
    texturePackage,
    geoMat,
    min,
    max,
    textureCodes,
    materialArr,
    definesArr,
    uniformsArr,
    maxTextureSize,
    mat,
    s3mVersion
) {
    let maxTexSize = 0;
    for (const p in texturePackage) {
        if (texturePackage[p].width * texturePackage[p].height * 4 > maxTexSize) {
            maxTexSize = texturePackage[p].width * texturePackage[p].height * 4;
        }
    }
    if (!MAX_TEX_SIZE || maxTexSize > MAX_TEX_SIZE) {
        BMP_BUFFER = new Uint8ClampedArray(maxTexSize + BMP_HEADER_LENGTH);
        MAX_TEX_SIZE = maxTexSize;
    }

    const texPromises = [];

    const sampler = {
        magFilter: 0x2601,
        minFilter: 0x2601,
        wrapS: 10497,
        wrapT: 10497,
    };

    const nodes = {};
    const meshes = {};
    const transferables = [];
    const sceneNodes = [];
    const materials = [];
    for(let meshIndex = 0; meshIndex < positionsArr.length; meshIndex++) {
        const indices = indicesArr[meshIndex];
        const vertexCount = allVertexCounts[meshIndex];
        const position = positionsArr[meshIndex];

        const uv0 = uv0sArr && uv0sArr[meshIndex] && uv0sArr[meshIndex];
        const textureCoordMatrixs = textureCoordMatrixArr && textureCoordMatrixArr[meshIndex];
        const normals = normalsArr && normalsArr[meshIndex] && normalsArr[meshIndex];
        const colors = colorsArr && colorsArr[meshIndex] && colorsArr[meshIndex];
        const batchIds = batchIdArr && batchIdArr[meshIndex] && batchIdArr[meshIndex];
        const attributes = {
            POSITION: {
                array: position,
                componentType: getComponentType(position.constructor),
                count: vertexCount,
                byteOffset: position.byteOffset,
                byteStride: 0,
                byteLength: position.byteLength,
                type: getAttrType(position.length / vertexCount),
                itemSize: position.length / vertexCount,
                name: "POSITION",
                min,
                max
            }
        };
        if (transferables.indexOf(position.buffer) < 0) {
            transferables.push(position.buffer);
        }
        if (uv0) {
            addGLTFAttr(attributes, 'TEXCOORD_0', uv0, vertexCount, transferables);
        }

        if (textureCoordMatrixs) {
            addGLTFAttr(attributes, 'TextureCoordMatrix', textureCoordMatrixs, vertexCount, transferables);
        }

        if (normals) {
            addGLTFAttr(attributes, 'NORMAL', normals, vertexCount, transferables);
        }

        if (colors) {
            addGLTFAttr(attributes, 'COLOR_0', colors, vertexCount, transferables);
        }

        if (batchIds) {
            addGLTFAttr(attributes, '_BATCHID', batchIds, vertexCount, transferables);
        }

        const prim = {
            attributes,
            material: meshIndex,
            compressDefines: definesArr[meshIndex],
            compressUniforms: uniformsArr[meshIndex],
            indices: {
                array: indices.slice(),
                itemSize: 1,
                byteLength: indices.byteLength,
                byteOffset: 0,
                byteStride: 0,
                name: indices,
                count: indices.length,
                componentType: 5123
            },
            mode: 4
        }
        transferables.push(prim.indices.array.buffer);

        const mesh = {
            primitives: [prim],
            index: meshIndex
        };
        meshes[meshIndex] = mesh;
        const node = {
            mesh: meshIndex,
            nodeIndex: meshIndex,
            matrix: mat
        };
        nodes[meshIndex] = node;
        sceneNodes.push({
            nodes: [node]
        });

        const material = materialArr[meshIndex];
        const materialPass = {
            uFillForeColor: [1, 1, 1, 1]
        };
        let ambient = material.ambient;
        materialPass.ambientColor = [ambient.r, ambient.g, ambient.b, ambient.a];
        let diffuse = material.diffuse;
        materialPass.uDiffuseColor = [diffuse.r, diffuse.g, diffuse.b, diffuse.a];
        let specular = material.specular;
        materialPass.specularColor = [specular.r, specular.g, specular.b, specular.a];
        materialPass.shininess = material.shininess;
        materialPass.bTransparentSorting = material.transparentsorting;
        let textureStates = material.textureunitstates;
        let len = textureStates.length;
        if (len) {
            materialPass.uTexMatrix = textureStates[0].textureunitstate.texmodmatrix;
            const texture0Id = textureStates[0].textureunitstate.id;
            const texture0Obj = texturePackage[texture0Id];
            materialPass.uTexture0Width = texture0Obj.width;

            if (textureStates[1]) {
                const texture1Id = textureStates[1].textureunitstate.id;
                const texture1Obj = texturePackage[texture1Id];
                materialPass.uTexture1Width = texture1Obj.width;
            }
        }

        materials.push({
            pbrMetallicRoughness: {
                baseColorFactor: [
                    0.8,
                    0.8,
                    0.8,
                    1
                ],
                metallicFactor: 0,
                roughnessFactor: 0.5
            },
            extensions: {
                KHR_techniques_webgl: {
                    technique: 0,
                    values: materialPass
                }
            }
        });

        texPromises.push(generateTexture(meshIndex, materialArr, textureCodes, texturePackage, maxTextureSize)
            .then((texture) => {
                if (!texture) {
                    return null;
                }
                const { array, mipmap, width, height, format, flipY } = texture;
                if (array && transferables.indexOf(array.buffer) < 0) {
                    transferables.push(array.buffer);
                }
                if (mipmap) {
                    for (let i = 0; i < mipmap.length; i++) {
                        if (array && transferables.indexOf(mipmap[i].buffer) < 0) {
                            transferables.push(mipmap[i].buffer);
                        }
                    }
                }
                let imageSampler = sampler;
                if (mipmap) {
                    imageSampler = {
                        magFilter: sampler.magFilter,
                        minFilter: 0x2703,
                        wrapS: sampler.wrapS,
                        wrapT: sampler.wrapT,
                    };
                }
                return {
                    materialIndex: meshIndex,
                    image: {
                        mipmap,
                        array,
                        flipY: !!flipY,
                        width,
                        height,
                        mimeType: 'image/bmp'
                    },
                    sampler: imageSampler,
                    format,
                    source: meshIndex
                }
            }
            ));
    }

    return Promise.all(texPromises).then((textures) => {
        textures = textures.filter(t => !!t);
        for (let i = 0; i < textures.length; i++) {
            const { materialIndex } = textures[i];
            let keyName = 'uTexture';
            if (materials[materialIndex].extensions['KHR_techniques_webgl'].values['uTexture']) {
                keyName = 'uTexture2';
            }
            materials[materialIndex].extensions['KHR_techniques_webgl'].values[keyName] = {
                'index': i,
                'texCoord': materialIndex
            };
            delete textures[i].materialIndex;
        }
        return {
            transferables,
            gltf: {
                "asset": {
                    "generator": "S3M",
                    "version": "2.0",
                    "s3mVersion": s3mVersion
                },
                "scene": 0,
                "scenes": sceneNodes,
                "nodes": nodes,
                "meshes": meshes,
                "materials": materials,
                "skins": [],
                "animations": null,
                "textures": textures,
                "transferables": [
                    {},
                    {},
                    {},
                    {},
                    {}
                ]
            }
        }
    });
}


let supportOffscreenLoad = false;
if (typeof OffscreenCanvas !== 'undefined') {
    let ctx;
    try {
        ctx = new OffscreenCanvas(2, 2).getContext('2d', { willReadFrequently: true });
    } catch (err) {
        //nothing need to do
    }
    if (ctx && typeof createImageBitmap !== 'undefined') {
        supportOffscreenLoad = true;
    }
}


const ARRAYS = {};

function generateTexture(meshIndex, materialArr, textureCodes, texturePackage, maxTextureSize) {
    const bmpBuffer = BMP_BUFFER;
    const bmpHeaderLength = BMP_HEADER_LENGTH;
    return new Promise(function(subResolve) {
        (function(k) {
            let hasTexture = materialArr[k].textureunitstates[0];
            if(hasTexture) {
                let textureId = materialArr[k].textureunitstates[0].textureunitstate.id;
                let textureObj = texturePackage[textureId];
                let imageBuffer = textureObj.arrayBufferView;
                let pixelFormat = textureObj.nFormat;
                let internalFormat = textureObj.internalFormat;
                if (isCompressedFormat(internalFormat) && textureObj.width === textureObj.height) {
                    const decompressed = decompressTexture(imageBuffer, imageBuffer.byteOffset, internalFormat, pixelFormat, textureObj.width, textureObj.height);
                    if (decompressed) {
                        const { mipmap, flipY } = decompressed;
                        subResolve({
                            format: internalFormat,
                            mipmap,
                            flipY,
                            width: textureObj.width,
                            height: textureObj.height
                        });
                        return;
                    }
                }

                let bmpByteLength;

                if (pixelFormat > S3MPixelFormat.BGR || pixelFormat === S3MPixelFormat.LUMINANCE_ALPHA) {
                    bmpByteLength = (bmpHeaderLength + textureObj.width * textureObj.height * 4);
                }
                else {
                    bmpByteLength = (bmpHeaderLength / 2 + textureObj.width * textureObj.height);
                }
                DXTTextureDecode.decode(bmpBuffer.subarray(bmpHeaderLength), textureObj.width, textureObj.height, imageBuffer, pixelFormat);

                _fillBMPHeader(bmpBuffer.buffer, textureObj.width, textureObj.height);


                let { width, height } = textureObj;
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

                let array;
                let format = 0x1908;
                const arrayByteLength = textureObj.width * textureObj.height * 4;
                if (supportOffscreenLoad && (width !== textureObj.width || height !== textureObj.height)) {
                    // 如果需要resize，则重用ARRAYS中的数组，避免新数组的创建
                    if (!ARRAYS[arrayByteLength]) {
                        ARRAYS[arrayByteLength] = new Uint8Array(arrayByteLength);
                    }
                    array = ARRAYS[arrayByteLength];
                } else {
                    array = new Uint8Array(arrayByteLength * 3 / 4);
                    format = 0x1907;
                }


                array = decodeBMP(array, bmpBuffer.buffer, 0, bmpByteLength);


                if (supportOffscreenLoad && (width !== textureObj.width || height !== textureObj.height)) {
                    array = resizeTexArray(array, textureObj.width, textureObj.height, width, height);
                }

                if (array.buffer === (ARRAYS[arrayByteLength] && ARRAYS[arrayByteLength].buffer)) {
                    array = new Uint8Array(array);
                }

                subResolve({
                    array,
                    width,
                    height,
                    format
                });

            } else {
                subResolve(null);
            }
        })(meshIndex);

    });
}

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}


function floorPowerOfTwo(value) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}

let offCanvas, offCtx;
let dstCanvas, dstCtx;
function resizeTexArray(array, srcWidth, srcHeight, dstWidth, dstHeight) {
    if (!offCanvas) {
        offCanvas = new OffscreenCanvas(2, 2);
        offCtx = offCanvas.getContext('2d');
        dstCanvas = new OffscreenCanvas(2, 2);
        dstCtx = dstCanvas.getContext('2d', { willReadFrequently: true });
    }
    const imageData = new ImageData(new Uint8ClampedArray(array.buffer), srcWidth, srcHeight);
    offCanvas.width = srcWidth;
    offCanvas.height = srcHeight;

    offCtx.putImageData(imageData, 0, 0);

    dstCanvas.width = dstWidth;
    dstCanvas.height = dstHeight;
    dstCtx.drawImage(offCanvas, 0, 0, dstWidth, dstHeight);

    return dstCtx.getImageData(0, 0, dstWidth, dstHeight).data;
}


const PixelFormat = {
    RGB_DXT1: 33776,
    RGBA_DXT1: 33777,
    RGBA_DXT3: 33778,
    RGBA_DXT5: 33779,
    RGB_PVRTC_4BPPV1: 35840,
    RGB_PVRTC_2BPPV1: 35841,
    RGBA_PVRTC_4BPPV1: 35842,
    RGBA_PVRTC_2BPPV1: 35843,
    RGBA_ASTC: 37808,
    RGB_ETC1: 36196,
    RGB8_ETC2: 37492,
    RGBA8_ETC2_EAC: 37496,
    RGBA_BC7: 36492
};

function isCompressedFormat(e) {
    return e === PixelFormat.RGB_DXT1 || e === PixelFormat.RGBA_DXT1 || e === PixelFormat.RGBA_DXT3 || e === PixelFormat.RGBA_DXT5 || e === PixelFormat.RGB_PVRTC_4BPPV1 || e === PixelFormat.RGB_PVRTC_2BPPV1 || e === PixelFormat.RGBA_PVRTC_4BPPV1 || e === PixelFormat.RGBA_PVRTC_2BPPV1 || e === PixelFormat.RGBA_ASTC || e === PixelFormat.RGB_ETC1 || e === PixelFormat.RGB8_ETC2 || e === PixelFormat.RGBA8_ETC2_EAC || e === PixelFormat.RGBA_BC7
}

function parseAttrArr(name, vertexPackage, buffer, verticesCount, attrArr) {
    let attrLocation = vertexPackage.attrLocation[name];
    if(attrLocation) {
        const vertexAttribute = vertexPackage.vertexAttributes[attrLocation];
        if (vertexAttribute.typedArray.buffer !== buffer) {
            // batchId因为是单独构造的，直接添加它的typedArray
            attrArr.push(vertexAttribute.typedArray);
        } else {
            let itemSize = vertexAttribute.componentsPerAttribute;
            const ctor = getTypedArrayCtor(vertexAttribute.componentDatatype);
            let array = new ctor(buffer,
                vertexAttribute.offsetInBytes + vertexAttribute.typedArray.byteOffset, verticesCount * itemSize
            );
            attrArr.push(array);
        }

    } else {
        attrArr.push(undefined);
    }
}

function addGLTFAttr(attributes, name, array, vertexCount, transferables) {
    attributes[name] = {
        array: array,
        componentType: getComponentType(array.constructor),
        count: vertexCount,
        byteOffset: array.byteOffset,
        byteStride: 0,
        byteLength: array.byteLength,
        type: getAttrType(array.length / vertexCount),
        itemSize: array.length / vertexCount,
        name
    }
    if (transferables.indexOf(array.buffer) < 0) {
        transferables.push(array.buffer);
    }
}
