import { fillArray } from '../../Util';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';

export const PREFIX = '_fn_type_';
/**
 * 如果 symbolDef 有 function-type 类型，则准备需要的数据
 * @param {*} geometry
 * @param {*} features
 * @param {*} symbolDef
 * @param {*} config
 */
export function prepareFnTypeData(geometry, features, symbolDef, config) {
    const aPickingId = geometry.data.aPickingId;
    const geoProps = geometry.properties;
    for (let i = 0; i < config.length; i++) {
        const { attrName, symbolName } = config[i];
        const arr = geometry.data[attrName];
        if (!arr) {
            continue;
        }
        const stopValues = getFnTypePropertyStopValues(symbolDef[symbolName].stops);
        if (!stopValues.length) {
            //说明stops中没有function-type类型
            continue;
        }
        const aIndex = createFnTypeFeatureIndex(features, aPickingId, symbolDef[symbolName].property, stopValues);
        if (!aIndex.length) {
            //说明瓦片中没有 function-type 中涉及的 feature
            continue;
        }
        geoProps[PREFIX + attrName + 'Index'] = aIndex;
        geoProps[PREFIX + attrName] = new arr.constructor(arr);
        if (!geoProps.aPickingId) {
            geoProps.aPickingId = new aPickingId.constructor(aPickingId);
        }
        if (!geoProps.features) {
            geometry.features = features;
        }
    }
}

/**
 * 如果symbol中有function-type，则根据需要更新属性
 * @param {Object} config
 * @param {Array} meshes
 */
export function updateGeometryFnTypeAttrib(config, meshes) {
    for (let c = 0; c < config.length; c++) {
        const { attrName, evaluate } = config[c];
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (!mesh) {
                continue;
            }
            const geometry = mesh.geometry;
            if (!geometry) {
                continue;
            }
            const { aPickingId } = geometry.properties;
            const aIndex = geometry.properties[PREFIX + attrName + 'Index'];
            if (!aPickingId || !aIndex) {
                continue;
            }
            updateFnTypeAttrib(attrName, geometry, aIndex, evaluate);
        }
    }
}

function isFnTypeFeature(feature, property, stopValues) {
    for (let i = 0; i < stopValues.length; i++) {
        if (property[0] === '$' && feature[property.substring(0)] === stopValues[i] ||
            feature.properties[property] === stopValues[i]) {
            return true;
        }
    }
    return false;
}

/**
 * 遍历所有feature，判定哪些feature受function-type影响，并返回他们在aPickingId中的起始位置
 * @param {Array} features
 * @param {Array} aPickingId
 * @param {String} property
 * @param {Array} stopValues
 */
function createFnTypeFeatureIndex(features, aPickingId, property, stopValues) {
    const aIndex = [];
    let start = 0;
    let current = aPickingId[0];
    for (let ii = 1, l = aPickingId.length; ii < l; ii++) {
        if (aPickingId[ii] !== current || ii === l - 1) {
            if (isFnTypeFeature(features[current].feature, property, stopValues)) {
                aIndex.push(start, ii === l - 1 ? l : ii);
            }
            current = aPickingId[ii];
            start = ii;
        }
    }
    return aIndex;
}
/**
 * 获取function-type属性中stops中所有的可能的值，即获取下例中的 ['secondary', 'expressway']
 * stops: [['secondary', 1], ['expressway', 2]]
 * @param {Array} stops
 */
function getFnTypePropertyStopValues(stops) {
    const stopValues = [];
    for (let i = 0; i < stops.length; i++) {
        if (isFunctionDefinition(stops[i][1]) && !interpolated(stops[i][1]).isZoomConstant) {
            stopValues.push(stops[i][0]);
        }
    }
    return stopValues;
}

/**
 * 遍历并更新geometry的function-type属性数据
 * @param {String} attrName
 * @param {reshader.Geometry} geometry
 * @param {Array} aIndex
 * @param {Function} evaluate
 */
function updateFnTypeAttrib(attrName, geometry, aIndex, evaluate) {
    const { aPickingId, features } = geometry.properties;
    const arr = geometry.properties[PREFIX + attrName];
    const len = arr.length / aPickingId.length;
    const l = aIndex.length;
    for (let i = 0; i < l; i += 2) {
        const start = aIndex[i];
        const end = aIndex[i + 1];
        const feature = features[aPickingId[start]];
        const properties = feature ? feature.feature ? feature.feature.properties : null : null;
        const value = evaluate(properties, arr[start * len]);
        if (Array.isArray(value)) {
            let dirty = false;
            for (let ii = 0; ii < len; ii++) {
                if (arr[start * len + ii] !== value[ii]) {
                    dirty = true;
                    break;
                }
            }
            if (dirty) {
                for (let iii = start * len; iii < end * len; iii += len) {
                    arr.set(value, iii);
                }
                arr.dirty = true;
            }
        } else if (arr[start] !== value) {
            fillArray(arr, value, start, end);
            arr.dirty = true;
        }

    }
    if (arr.dirty) {
        geometry.updateData(attrName, arr);
        arr.dirty = false;
    }
}
