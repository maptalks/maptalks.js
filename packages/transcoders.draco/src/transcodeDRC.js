// 参考源代码
// https://github.com/google/draco/blob/master/javascript/time_draco_decode.html
// https://github.com/google/draco/tree/master/javascript/npm/draco3d

// draco 1.5
import wasmBinary from './lib/draco_decoder_base64.js';
import DracoDecoderModule from './lib/draco_decoder_gltf.js';

function createDecoderModule() {
    // DracoModule is created.
    return DracoDecoderModule({
        wasmBinary
    })
}

const dataTypes = {
    1: Int8Array,
    2: Uint8Array,
    3: Int16Array,
    4: Uint16Array,
    5: Int32Array,
    6: Uint32Array,
    // 7: Int64Array,
    // 8: Uint64Array
    9: Float32Array,
    10: Float64Array,
};

const componentTypes = {
    9: 0x1406,
    10: 0x1406,
    1: 0x1400,
    3: 0x1402,
    5: 0x1404,
    2: 0x1401,
    4: 0x1403,
    6: 0x1405
};

const accessorTypes = {
    1: 'SCALAR',
    2: 'VEC2',
    3: 'VEC3'
};

let dracoModule = null;
let dracoModulePromise = null;
export default function transcodeDRC(buffer, options) {
    if (!dracoModule && !dracoModulePromise) {
        dracoModulePromise = createDecoderModule({}).then((drcModule) => {
            dracoModule = drcModule;
            dracoModulePromise = null;
        });
        return dracoModulePromise.then(() => {
            return transcode(buffer, options);
        });
    } else if (dracoModulePromise) {
        return dracoModulePromise.then(() => {
            return transcode(buffer, options);
        });
    }
    return transcode(buffer, options);
}

function transcode(rawBuffer, options) {
    const decoder = new dracoModule.Decoder();
    const metadataQuerier = new dracoModule.MetadataQuerier();
    if (options['skipAttributeTransform']) {
        const { attributes } = options;
        for (const name in attributes) {
            const attributeID = attributes[name];
            if (attributeID >= 0) {
                decoder.SkipAttributeTransform(attributeID);
            }
        }
    }
    const buffer = new dracoModule.DecoderBuffer();
    if (rawBuffer instanceof DataView) {
        buffer.Init(new Int8Array(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength), rawBuffer.byteLength);
    } else {
        buffer.Init(new Int8Array(rawBuffer), rawBuffer.byteLength);
    }

    const geometryType = decoder.GetEncodedGeometryType(buffer);

    let dracoGeometry;
    let decodingStatus = null;
    if (geometryType === dracoModule.TRIANGULAR_MESH) {
        dracoGeometry = new dracoModule.Mesh();
        decodingStatus = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
    } else if (geometryType === dracoModule.POINT_CLOUD) {
        dracoGeometry = new dracoModule.PointCloud();
        decodingStatus = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
    } else {
        const errorMsg = 'Draco Error: Unknown geometry type: ' + geometryType;
        throw new Error(errorMsg);
    }
    if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
        throw new Error('Draco Error: Decoding failed: ' + decodingStatus.error_msg());
    }

    const geometry = decodeGeometry(decoder, geometryType, dracoGeometry, options.attributes, options.metadatas, metadataQuerier);
    dracoModule.destroy(buffer);
    dracoModule.destroy(decoder);
    dracoModule.destroy(metadataQuerier);
    return Promise.resolve(geometry);
}

function decodeGeometry(decoder, geometryType, dracoGeometry, attributes, metadatas, metadataQuerier) {
    const geometry = { indices: null, attributes: {}};
    for (const name in attributes) {
        let attributeID = attributes[name];
        const attrMetadatas = metadatas && metadatas[name];
        if (attributeID < 0) {
            attributeID = decoder.GetAttributeId(dracoGeometry, attributes[name]);
        }
        if (attributeID === -1) continue;
        const attribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributeID);

        const dataType = attribute.data_type();
        if (!dataType) {
            // invalid data type
            continue;
        }
        const attributeData = decodeAttribute(decoder, dracoGeometry, dataType, attribute, attrMetadatas, metadataQuerier);
        attributeData.name = name;
        geometry.attributes[name] = attributeData;
    }
    if (geometryType === dracoModule.TRIANGULAR_MESH) {
        const numFaces = dracoGeometry.num_faces();
        const numIndices = numFaces * 3;

        const index = new Uint32Array(numIndices);
        const indexArray = new dracoModule.DracoInt32Array();
        let maxIndexValue = 0;
        for (let i = 0; i < numFaces; i++) {
            decoder.GetFaceFromMesh(dracoGeometry, i, indexArray);
            for (let j = 0; j < 3; j++) {
                index[i * 3 + j] = indexArray.GetValue(j);
                if (index[i * 3 + j] > maxIndexValue) {
                    maxIndexValue = index[i * 3 + j];
                }
            }
        }
        const CTOR = getIndexArrayType(maxIndexValue);
        const array = new CTOR(index);
        geometry.indices = {
            array,
            itemSize: 1,
            byteLength: array.byteLength,
            byteOffset:0,
            byteStride: 0,
            name: 'indices',
            count: index.length,
            componentType: getIndexComponentType(maxIndexValue)
        };
        dracoModule.destroy(indexArray);
    }
    dracoModule.destroy(dracoGeometry);
    return geometry;
}

function decodeAttribute(decoder, dracoGeometry, dataType, attribute, metadatas, metadataQuerier) {
    const attributeType = dataTypes[dataType];
    const numComponents = attribute.num_components();
    const numPoints = dracoGeometry.num_points();
    const numValues = numPoints * numComponents;

    let quantization;
    let transform = new dracoModule.AttributeQuantizationTransform();
    let tr = transform.InitFromAttribute(attribute);
    if (tr) {
        const minValues = new Array(numComponents);
        for (let i = 0; i < numComponents; ++i) {
            minValues[i] = transform.min_value(i);
        }
        quantization = {
            quantizationBits: transform.quantization_bits(),
            minValues: minValues,
            range: transform.range(),
            octEncoded: false,
        };
    }
    dracoModule.destroy(transform);

    transform = new dracoModule.AttributeOctahedronTransform();
    tr = transform.InitFromAttribute(attribute);
    if (tr) {
        quantization = {
            quantizationBits: transform.quantization_bits(),
            octEncoded: true,
        };
    }
    dracoModule.destroy(transform);

    let array = null;
    if (quantization) {
        array = decodeQuantizedDracoTypedArray(dracoGeometry, decoder, attribute, quantization, numValues);
        // const normConstant = quantization.range / (1 << quantization.quantizationBits);
        // const minValues = quantization.minValues;
        // console.log(array[0] * normConstant + minValues[0], array[1] * normConstant + minValues[1], array[2] * normConstant + minValues[2]);

        // const fArray = new Float32Array(array.length);
        // for (let i = 0; i < array.length; i += numComponents) {
        //     if (numComponents === 2) {
        //         fArray[i] = array[i] * normConstant + minValues[0];
        //         fArray[i + 1] = array[i + 1] * normConstant + minValues[1];
        //     } else if (numComponents === 3) {
        //         fArray[i] = array[i] * normConstant + minValues[0];
        //         fArray[i + 1] = array[i + 1] * normConstant + minValues[1];
        //         fArray[i + 2] = array[i + 2] * normConstant + minValues[2];
        //     }
        // }
        // array = fArray;
    } else {
        let dracoArray;
        switch (attributeType) {
        case Float32Array:
            dracoArray = new dracoModule.DracoFloat32Array();
            decoder.GetAttributeFloatForAllPoints(dracoGeometry, attribute, dracoArray);
            array = new Float32Array(numValues);
            break;
        case Int8Array:
            dracoArray = new dracoModule.DracoInt8Array();
            decoder.GetAttributeInt8ForAllPoints(dracoGeometry, attribute, dracoArray);
            array = new Int8Array(numValues);
            break;
        case Int16Array:
            dracoArray = new dracoModule.DracoInt16Array();
            decoder.GetAttributeInt16ForAllPoints(dracoGeometry, attribute, dracoArray);
            array = new Int16Array(numValues);
            break;
        case Int32Array:
            dracoArray = new dracoModule.DracoInt32Array();
            decoder.GetAttributeInt32ForAllPoints(dracoGeometry, attribute, dracoArray);
            array = new Int32Array(numValues);
            break;
        case Uint8Array:
            dracoArray = new dracoModule.DracoUInt8Array();
            decoder.GetAttributeUInt8ForAllPoints(dracoGeometry, attribute, dracoArray);
            array = new Uint8Array(numValues);
            break;
        case Uint16Array:
            dracoArray = new dracoModule.DracoUInt16Array();
            decoder.GetAttributeUInt16ForAllPoints(dracoGeometry, attribute, dracoArray);
            array = new Uint16Array(numValues);
            break;
        case Uint32Array:
            dracoArray = new dracoModule.DracoUInt32Array();
            decoder.GetAttributeUInt32ForAllPoints(dracoGeometry, attribute, dracoArray);
            array = new Uint32Array(numValues);
            break;
        default:
            throw new Error('Draco Error: Unexpected attribute type: ' + attributeType && attributeType.name);
        }
        for (let i = 0; i < numValues; i++) {
            array[i] = dracoArray.GetValue(i);
        }
        dracoModule.destroy(dracoArray);
    }


    const meta = {};
    if (metadatas) {
        // get the attribute metadata
        const metadata = decoder.GetAttributeMetadata(
            dracoGeometry,
            attribute.unique_id()
        );
        if (metadata.ptr) {
            for (let i = 0; i < metadatas.length; i++) {
                const fnName = getEntryMethod(metadatas[i].type);
                const name = metadatas[i].name;
                meta[name] = {};
                meta[name].type = metadatas[i].type;
                meta[name].value = metadataQuerier[fnName](
                    metadata,
                    name
                );
            }
        }
    }


    const attrData = {
        array,
        meta,
        componentType: getComponentType(array),
        count: numPoints,
        byteOffset: 0,
        byteStride: 0,
        byteLength: numValues * array.BYTES_PER_ELEMENT,
        type: accessorTypes[numComponents],
        itemSize: numComponents
    };

    if (quantization) {
        attrData.quantization = quantization;
    }
    return attrData;
}

function getIndexArrayType(max) {
    // if (max < 256) return Uint8Array;
    // according to http://www.webglinsights.com/, Uint8Array performs badly in directx according to ANGLE
    if (max < 65536) return Uint16Array;
    return Uint32Array;
}

function getIndexComponentType(max) {
    if (max < 65536) return 0x1403;
    return 0x1405;
}


function decodeQuantizedDracoTypedArray(
    dracoGeometry,
    dracoDecoder,
    dracoAttribute,
    quantization,
    vertexArrayLength
) {
    let vertexArray;
    let attributeData;
    if (quantization.quantizationBits <= 8) {
        attributeData = new dracoModule.DracoUInt8Array();
        vertexArray = new Uint8Array(vertexArrayLength);
        dracoDecoder.GetAttributeUInt8ForAllPoints(
            dracoGeometry,
            dracoAttribute,
            attributeData
        );
    } else {
        attributeData = new dracoModule.DracoUInt16Array();
        vertexArray = new Uint16Array(vertexArrayLength);
        dracoDecoder.GetAttributeUInt16ForAllPoints(
            dracoGeometry,
            dracoAttribute,
            attributeData
        );
    }

    for (let i = 0; i < vertexArrayLength; ++i) {
        vertexArray[i] = attributeData.GetValue(i);
    }

    dracoModule.destroy(attributeData);
    return vertexArray;
}

function getComponentType(arr) {
    let dataType;
    for (const p in dataTypes) {
        if (arr.constructor === dataTypes[p]) {
            dataType = p;
            break;
        }
    }
    return componentTypes[dataType];
}

function getEntryMethod(type) {
    if (type === 'double') {
        return 'GetDoubleEntry';
    } else if (type === 'string') {
        return 'GetStringEntry';
    } else if (type === 'int') {
        return 'GetIntEntry';
    }
    return null;
}
