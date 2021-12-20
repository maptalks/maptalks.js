// 参考源代码
// https://github.com/google/draco/blob/master/javascript/time_draco_decode.html
// https://github.com/google/draco/tree/master/javascript/npm/draco3d

// draco 1.5
import wasmBinary from './lib/draco_decoder_base64.js';
import DracoDecoderModule from './lib/draco_decoder.js';

function createDecoderModule() {
  // DracoModule is created.
  return DracoDecoderModule({
      wasmBinary
  })
}

const dataTypes = {
    9: Float32Array,
    10: Float64Array,
    1: Int8Array,
    3: Int16Array,
    5: Int32Array,
    // 7: Int64Array,
    2: Uint8Array,
    4: Uint16Array,
    6: Uint32Array,
    // 8: Uint64Array
};

let dracoModule = null;

export default function transcodeDRC(buffer, options) {
    if (!dracoModule) {
        return createDecoderModule({}).then((drcModule) => {
            dracoModule = drcModule;
        }).then(() => {
            return transcode(buffer, options);
        });
    }
    return transcode(buffer, options);
}

function transcode(rawBuffer, options) {
    const decoder = new dracoModule.Decoder();
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
        decoder.DecodeBufferToMesh(buffer, dracoGeometry);
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

    const geometry = decodeGeometry(decoder, geometryType, dracoGeometry, options.attributes);
    dracoModule.destroy(buffer);

    return Promise.resolve(geometry);
}

function decodeGeometry(decoder, geometryType, dracoGeometry, attributes) {
    const geometry = { indices: null, attributes: {}};
    for (const name of attributes) {
        const attributeID = decoder.GetAttributeId(dracoGeometry, dracoModule[name]);
        if (attributeID === -1) continue;
        const attribute = decoder.GetAttribute(dracoGeometry, attributeID);

        const attributeType = dataTypes[attribute.data_type()];
        const attributeData = decodeAttribute(decoder, dracoGeometry, name, attributeType, attribute);
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
        geometry.indices = { array: new CTOR(index), itemSize: 1 };
        dracoModule.destroy(indexArray);
    }
    dracoModule.destroy(dracoGeometry);
    return geometry;
}

function decodeAttribute(decoder, dracoGeometry, attributeName, attributeType, attribute) {
    const numComponents = attribute.num_components();
    const numPoints = dracoGeometry.num_points();
    const numValues = numPoints * numComponents;
    let dracoArray;
    let array = null;
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
        throw new Error('Draco Error: Unexpected attribute type: ' + attributeType.name);
    }
    for (let i = 0; i < numValues; i++) {
        array[i] = dracoArray.GetValue(i);
    }
    dracoModule.destroy(dracoArray);
    return {
        name: attributeName,
        array: array,
        itemSize: numComponents
    };
}

function getIndexArrayType(max) {
    // if (max < 256) return Uint8Array;
    // according to http://www.webglinsights.com/, Uint8Array performs badly in directx according to ANGLE
    if (max < 65536) return Uint16Array;
    return Uint32Array;
}
