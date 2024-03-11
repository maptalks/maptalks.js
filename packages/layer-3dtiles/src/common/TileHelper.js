import { stringFromUTF8Array, sign as mathSign } from './Util.js';
import { vec3, mat3, mat4 } from 'gl-matrix';
import { cartesian3ToDegree, geodeticSurfaceNormal, radianToCartesian3 } from './Transform';
import { EPSILON14, equalsEpsilon } from './Math';

export function readMagic(view, offset) {
    let magic = '';
    for (let i = 0; i < 4; i++) {
        const code = view.getUint8(offset + i);
        magic += String.fromCharCode(code);
    }
    return magic;
}

const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

export function readFeatureTableJSON(buffer, byteOffset, byteLength) {
    const arr = new Uint8Array(buffer, byteOffset, byteLength);
    if (textDecoder) {
        return JSON.parse(textDecoder.decode(arr));
    } else {
        return JSON.parse(stringFromUTF8Array(arr));
    }
}

export function readFeatureTableBin(buffer, byteOffset, byteLength) {
    return {
        offset: byteOffset,
        byteLength: byteLength
    };
}


export function readBatchTableJSON(buffer, byteOffset, byteLength) {
    const arr = new Uint8Array(buffer, byteOffset, byteLength);
    if (textDecoder) {
        return JSON.parse(textDecoder.decode(arr));
    } else {
        return JSON.parse(stringFromUTF8Array(arr));
    }
}

export function readBatchTableBin(buffer, byteOffset, byteLength) {
    return {
        offset: byteOffset,
        byteLength
    };
}

export function readBatchArray(batchId, buf, offset, count) {
    const { byteOffset, componentType, type } = batchId;
    const { ctor, type: reglType } = getComponentCtor(componentType || 'UNSIGNED_SHORT');
    const itemSize = getItemSize(type);
    return {
        byteStride: 0,
        byteOffset: byteOffset + offset,
        itemSize,
        count: count * itemSize,
        componentType: reglType,
        array: new ctor(buf, offset + byteOffset, count * itemSize)
    }
}

export function readBatchId(batchId, buf, offset, count) {
    const batchIdData = readBatchArray(batchId, buf, offset, count);
    if (batchIdData.array.buffer.byteLength !== buf.byteLength) {
        batchIdData.array = batchIdData.array.slice();
    }
    return batchIdData;
}

export function readBatchData(batchId, buf, count, index) {
    const { byteOffset, componentType, type } = batchId;
    const { ctor } = getComponentCtor(componentType || 'UNSIGNED_SHORT');
    const itemSize = getItemSize(type);
    const array = new ctor(buf, byteOffset, count * itemSize);
    if (itemSize === 1) {
        return array[index];
    } else {
        return array.subarray(index * itemSize, index * itemSize + itemSize);
    }

}

const TYPE_SIZES = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4
};

export function getItemSize(type) {
    if (!type) {
        return 1;
    }
    return TYPE_SIZES[type];
}

const typeMap = {
    "BYTE": { ctor: Int8Array, type: 0x1400, name: 'Int8Array' },
    "UNSIGNED_BYTE": { ctor: Uint8Array, type: 0x1401, name: 'Uint8Array' },
    "SHORT": { ctor: Int16Array, type: 0x1402, name: 'Int16Array' },
    "UNSIGNED_SHORT": { ctor: Uint16Array, type: 0x1403, name: 'Uint16Array' },
    "INT": { ctor: Int32Array, type: 0x1404, name: 'Int32Array' },
    "UNSIGNED_INT": { ctor: Uint32Array, type: 0x1405, name: 'Uint32Array' },
    "FLOAT": { ctor: Float32Array, type: 0x1406, name: 'Float32Array' },
    "DOUBLE": { ctor: Float64Array, type: 0x1406, name: 'Float64Array' }
};

export function getComponentCtor(componentType) {
    return typeMap[componentType];
}

export function getComponentFromCtor(ctor) {
    for (const p in typeMap) {
        if (ctor === typeMap[p].ctor) {
            return typeMap[p].type;
        }
    }
    throw new Error('unrecognized ctor:' + ctor);
}

export function convertQuantizedPosition(out, arr, offset, scale) {
    const position = out;
    const count = arr.length / 3;
    for (let i = 0; i < count; i++) {
        position[i * 3] = (arr[i * 3] / 65535.0) * scale[0] + offset[0];
        position[i * 3 + 1] = (arr[i * 3 + 1] / 65535.0) * scale[1] + offset[1];
        position[i * 3 + 2] = (arr[i * 3 + 2] / 65535.0) * scale[2] + offset[2];
    }
    return position;
}


export function readFeatureTableBatchTable(view, byteOffset, transferables) {
    const featureTableJsonByteLength = view.getUint32(12, true);
    const featureTableBinaryByteLength = view.getUint32(16, true);
    const batchTableJsonByteLength = view.getUint32(20, true);
    const batchTableBinaryByteLength = view.getUint32(24, true);

    const i3dmBuf = view.buffer;
    let featureTable = {}, featureTableBin;
    let batchTable = {}, batchTableBin = null;
    if (featureTableJsonByteLength > 0) {
        featureTable = readFeatureTableJSON(i3dmBuf, byteOffset, featureTableJsonByteLength);
        byteOffset += featureTableJsonByteLength;
    }
    if (featureTableBinaryByteLength > 0) {
        featureTableBin = readFeatureTableBin(i3dmBuf, byteOffset, featureTableBinaryByteLength);
        byteOffset += featureTableBinaryByteLength;
    }
    if (batchTableJsonByteLength > 0) {
        batchTable = readBatchTableJSON(i3dmBuf, byteOffset, batchTableJsonByteLength);
        byteOffset += batchTableJsonByteLength;
    }
    const batchTableBinInfo = readBatchTableBin(i3dmBuf, byteOffset, batchTableBinaryByteLength);
    batchTableBin = i3dmBuf.slice(batchTableBinInfo.offset, batchTableBinInfo.offset + batchTableBinInfo.byteLength);
    transferables.push(batchTableBin);

    return {
        featureTable, featureTableBin, batchTable, batchTableBin
    };
}


const vectorProductLocalFrame = {
    up: {
        south: "east",
        north: "west",
        west: "south",
        east: "north",
    },
    down: {
        south: "west",
        north: "east",
        west: "north",
        east: "south",
    },
    south: {
        up: "west",
        down: "east",
        west: "down",
        east: "up",
    },
    north: {
        up: "east",
        down: "west",
        west: "up",
        east: "down",
    },
    west: {
        up: "north",
        down: "south",
        north: "down",
        south: "up",
    },
    east: {
        up: "south",
        down: "north",
        north: "up",
        south: "down",
    },
};

const degeneratePositionLocalFrame = {
    north: [-1, 0, 0],
    east: [0, 1, 0],
    up: [0, 0, 1],
    south: [1, 0, 0],
    west: [0, -1, 0],
    down: [0, 0, -1],
};
const localFrameToFixedFrameCache = {};
const scratchCalculateCartesian = {
    east:[],
    north:[],
    up:[],
    west:[],
    south:[],
    down:[],
};
let scratchFirstCartesian = [];
let scratchSecondCartesian = [];
let scratchThirdCartesian = [];

const ZERO = [0, 0, 0];

function localFrameToFixedFrameGenerator(firstAxis, secondAxis) {
    const thirdAxis = vectorProductLocalFrame[firstAxis][secondAxis];

    /**
   * Computes a 4x4 transformation matrix from a reference frame
   * centered at the provided origin to the provided ellipsoid's fixed reference frame.
   * @callback Transforms.LocalFrameToFixedFrame
   * @param {Cartesian3} origin The center point of the local reference frame.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid whose fixed frame is used in the transformation.
   * @param {Matrix4} [result] The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter or a new Matrix4 instance if none was provided.
   */
    let resultat;
    const hashAxis = firstAxis + secondAxis;
    if (localFrameToFixedFrameCache[hashAxis]) {
        resultat = localFrameToFixedFrameCache[hashAxis];
    } else {
        resultat = function (origin, ellipsoid, result) {
            if (
                vec3.equals(origin, ZERO)
            ) {
                // If x, y, and z are zero, use the degenerate local frame, which is a special case
                vec3.copy(scratchFirstCartesian, degeneratePositionLocalFrame[firstAxis]);
                vec3.copy(scratchSecondCartesian, degeneratePositionLocalFrame[secondAxis]);
                vec3.copy(scratchThirdCartesian, degeneratePositionLocalFrame[thirdAxis]);
            } else if (
                equalsEpsilon(origin[0], 0.0, EPSILON14) &&
        equalsEpsilon(origin[1], 0.0, EPSILON14)
            ) {
                // If x and y are zero, assume origin is at a pole, which is a special case.
                const sign = mathSign(origin[2]);

                vec3.copy(scratchFirstCartesian, degeneratePositionLocalFrame[firstAxis]);
                if (firstAxis !== "east" && firstAxis !== "west") {
                    vec3.scale(scratchFirstCartesian, scratchFirstCartesian, sign);
                }

                vec3.copy(scratchSecondCartesian, degeneratePositionLocalFrame[secondAxis]);
                if (secondAxis !== "east" && secondAxis !== "west") {
                    vec3.scale(scratchSecondCartesian, scratchSecondCartesian, sign);
                }

                vec3.copy(scratchThirdCartesian, degeneratePositionLocalFrame[thirdAxis]);
                if (thirdAxis !== "east" && thirdAxis !== "west") {
                    vec3.scale(scratchThirdCartesian, scratchThirdCartesian, sign);
                }
            } else {
                geodeticSurfaceNormal(origin, scratchCalculateCartesian.up);

                const up = scratchCalculateCartesian.up;
                const east = scratchCalculateCartesian.east;
                east[0] = -origin[1];
                east[1] = origin[0];
                east[2] = 0.0;
                vec3.normalize(scratchCalculateCartesian.east, east);
                vec3.cross(scratchCalculateCartesian.north, up, east);

                vec3.scale(
                    scratchCalculateCartesian.down,
                    scratchCalculateCartesian.up,
                    -1
                );
                vec3.scale(
                    scratchCalculateCartesian.west,
                    scratchCalculateCartesian.east,
                    -1
                );
                vec3.scale(
                    scratchCalculateCartesian.south,
                    scratchCalculateCartesian.north,
                    -1
                );

                scratchFirstCartesian = scratchCalculateCartesian[firstAxis];
                scratchSecondCartesian = scratchCalculateCartesian[secondAxis];
                scratchThirdCartesian = scratchCalculateCartesian[thirdAxis];
            }
            result[0] = scratchFirstCartesian[0];
            result[1] = scratchFirstCartesian[1];
            result[2] = scratchFirstCartesian[2];
            result[3] = 0.0;
            result[4] = scratchSecondCartesian[0];
            result[5] = scratchSecondCartesian[1];
            result[6] = scratchSecondCartesian[2];
            result[7] = 0.0;
            result[8] = scratchThirdCartesian[0];
            result[9] = scratchThirdCartesian[1];
            result[10] = scratchThirdCartesian[2];
            result[11] = 0.0;
            result[12] = origin[0];
            result[13] = origin[1];
            result[14] = origin[2];
            result[15] = 1.0;
            return result;
        };
        localFrameToFixedFrameCache[hashAxis] = resultat;
    }
    return resultat;
}

function multiplyByMatrix3 (matrix, rotation, result) {
    //>>includeEnd('debug');

    const left0 = matrix[0];
    const left1 = matrix[1];
    const left2 = matrix[2];
    const left4 = matrix[4];
    const left5 = matrix[5];
    const left6 = matrix[6];
    const left8 = matrix[8];
    const left9 = matrix[9];
    const left10 = matrix[10];

    const right0 = rotation[0];
    const right1 = rotation[1];
    const right2 = rotation[2];
    const right4 = rotation[3];
    const right5 = rotation[4];
    const right6 = rotation[5];
    const right8 = rotation[6];
    const right9 = rotation[7];
    const right10 = rotation[8];

    const column0Row0 = left0 * right0 + left4 * right1 + left8 * right2;
    const column0Row1 = left1 * right0 + left5 * right1 + left9 * right2;
    const column0Row2 = left2 * right0 + left6 * right1 + left10 * right2;

    const column1Row0 = left0 * right4 + left4 * right5 + left8 * right6;
    const column1Row1 = left1 * right4 + left5 * right5 + left9 * right6;
    const column1Row2 = left2 * right4 + left6 * right5 + left10 * right6;

    const column2Row0 = left0 * right8 + left4 * right9 + left8 * right10;
    const column2Row1 = left1 * right8 + left5 * right9 + left9 * right10;
    const column2Row2 = left2 * right8 + left6 * right9 + left10 * right10;

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = 0.0;
    result[4] = column1Row0;
    result[5] = column1Row1;
    result[6] = column1Row2;
    result[7] = 0.0;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = 0.0;
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
}

// function fromRowMajor(
//   column0Row0,
//   column1Row0,
//   column2Row0,
//   column3Row0,
//   column0Row1,
//   column1Row1,
//   column2Row1,
//   column3Row1,
//   column0Row2,
//   column1Row2,
//   column2Row2,
//   column3Row2,
//   column0Row3,
//   column1Row3,
//   column2Row3,
//   column3Row3) {
//   const out = [];
//   out[0] = column0Row0 || 0.0;
//   out[1] = column0Row1 || 0.0;
//   out[2] = column0Row2 || 0.0;
//   out[3] = column0Row3 || 0.0;
//   out[4] = column1Row0 || 0.0;
//   out[5] = column1Row1 || 0.0;
//   out[6] = column1Row2 || 0.0;
//   out[7] = column1Row3 || 0.0;
//   out[8] = column2Row0 || 0.0;
//   out[9] = column2Row1 || 0.0;
//   out[10] = column2Row2 || 0.0;
//   out[11] = column2Row3 || 0.0;
//   out[12] = column3Row0 || 0.0;
//   out[13] = column3Row1 || 0.0;
//   out[14] = column3Row2 || 0.0;
//   out[15] = column3Row3 || 0.0;
//   return out;
// }

export function setTranslation(matrix, translation, result) {

    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];

    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];

    result[8] = matrix[8];
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];

    result[12] = translation[0];
    result[13] = translation[1];
    result[14] = translation[2];
    result[15] = matrix[15];

    return result;
}

export function getTranslation(out, matrix) {
    vec3.set(out, matrix[12], matrix[13], matrix[14]);
    return out;
}


export const eastNorthUpToFixedFrame = localFrameToFixedFrameGenerator(
    "east",
    "north"
);
const scratchRTCCoord = [];
const scratchFromENU = [];
const scratchToENU = [];
const scratchRotation = [];
const RADIAN = Math.PI / 180;

export function basisTo2D(result, rtcCoord, matrix, projection) {
    rtcCoord = vec3.copy(scratchRTCCoord, rtcCoord);
    const viewCenter = radianToCartesian3(scratchRTCCoord, rtcCoord[0] * RADIAN, rtcCoord[1] * RADIAN, rtcCoord[2]);

    const ellipsoid = projection.ellipsoid;
    // Assuming the instance are positioned in WGS84, invert the WGS84 transform to get the local transform and then convert to 2D
    const fromENU = eastNorthUpToFixedFrame(
        viewCenter,
        ellipsoid,
        scratchFromENU
    );
    const toENU = mat4.invert(scratchToENU, fromENU);
    const rotation = mat3.fromMat4(scratchRotation, matrix);
    multiplyByMatrix3(toENU, rotation, result);
    // mat4.multiply(result, swizzleMatrix, local); // Swap x, y, z for 2D
    // setTranslation(result, projectedPosition, local); // Use the projected center
    return result;
}


const component_ctors = {
    5120: Int8Array,
    5122: Int16Array,
    5124: Int32Array,
    5121: Uint8Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
};

export function getTypedArrayCtor(type) {
    return component_ctors[type];
}

export function getComponentType(ctor) {
    for (const p in component_ctors) {
        if (ctor === component_ctors[p]) {
            return +p;
        }
    }
    throw new Error('unrecognized ctor:' + ctor);
}

// 用数据的width获得数据的类型
export function getAttrType(width) {
    if (width === 1) {
        return 'FLOAT';
    }
    return 'VEC' + width;
}
