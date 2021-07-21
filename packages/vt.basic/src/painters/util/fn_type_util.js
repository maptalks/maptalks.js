import { fillArray } from '../../Util';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';

export const PREFIX = '_fn_type_';
export const SYMBOLS_SUPPORT_IDENTITY_FN_TYPE = {
    'textFill': 1,
    'textSize': 1,
    'textOpacity': 1,
    'markerWidth': 1,
    'markerHeight': 1,
    'markerOpacity': 1,
    'lineWidth': 1,
    'lineColor': 1,
    'lineOpacity': 1,
    'polygonFill': 1,
    'polygonOpacity': 1
};

const SAVED_FN_TYPE = '__current_fn_types';
/**
 * 如果 symbolDef 有 function-type 类型，则准备需要的数据
 * @param {*} geometry
 * @param {*} features
 * @param {*} symbolDef
 * @param {*} configs
 */
export function prepareFnTypeData(geometry, symbolDef, configs) {
    for (let i = 0; i < configs.length; i++) {
        const { symbolName } = configs[i];
        const savedTypes = geometry[SAVED_FN_TYPE] = geometry[SAVED_FN_TYPE] || {};
        savedTypes[symbolName] = symbolDef[symbolName];
        prepareAttr(geometry, symbolDef, configs[i]);
    }
}

function prepareAttr(geometry, symbolDef, config) {
    const geoProps = geometry.properties;
    let aPickingId = geoProps.aPickingId;
    if (!aPickingId) {
        aPickingId = geoProps.aPickingId = new geometry.data.aPickingId.constructor(geometry.data.aPickingId);
    }

    const { attrName, symbolName, evaluate } = config;
    let arr = geometry.data[attrName];
    if (!arr) {
        if (!isFnTypeSymbol(symbolDef[symbolName])) {
            return null;
        } else {
            //symbol是fn-type，但arr不存在，则创建
            arr = geometry.data[attrName] = new config.type(config.width * aPickingId.length);
            createZoomFnTypeIndexData(geometry, symbolDef, config);
            const aIndex = geometry.properties[PREFIX + attrName + 'Index'];
            updateFnTypeAttrib(attrName, geometry, aIndex, evaluate);
            return arr;
        }
    } else if (!isFnTypeSymbol(symbolDef[symbolName])) {
        //symbol不是fn-type，但存在attr，则删除arr和aIndex
        if (arr && arr.buffer && arr.buffer.destroy) {
            arr.buffer.destroy();
        }
        delete geometry.data[attrName];
        removeFnTypePropArrs(geometry, attrName);
        return null;
    }
    createZoomFnTypeIndexData(geometry, symbolDef, config);
    return arr;
}

/**
 * 检查config中属性，fntype的stops中是否存在与zoom有关的fn-type 或者 identity fn-type
 * 如果有，则创建受影响的feature索引，方便地图zoom时更新属性
 *
 * */
function createZoomFnTypeIndexData(geometry, symbolDef, config) {
    const { attrName, symbolName } = config;
    const stopValues = getFnTypePropertyStopValues(symbolDef[symbolName].stops);
    const isIdentityFn = symbolDef[symbolName].type === 'identity';
    // symbol是identity类型，且属性支持 fn type 值
    // TODO 这里应该遍历features，检查是否有 fn type 的值
    const hasZoomIdentity = isIdentityFn && checkIfIdentityZoomDependent(config, symbolDef[symbolName], geometry);
    if (!hasZoomIdentity && !stopValues.length) {
        //说明stops中没有function-type类型
        removeFnTypePropArrs(geometry, attrName);
        return;
    }

    const geoProps = geometry.properties;
    const { features, aPickingId } = geoProps;
    const aIndex = createFnTypeFeatureIndex(features, aPickingId, symbolDef[symbolName].property, stopValues, hasZoomIdentity);
    if (!aIndex.length) {
        //说明瓦片中没有 function-type 中涉及的 feature
        removeFnTypePropArrs(geometry, attrName);
        return;
    }
    const arr = geometry.data[attrName];
    geoProps[PREFIX + attrName + 'Index'] = aIndex;
    geoProps[PREFIX + attrName] = arr.BYTES_PER_ELEMENT ? new arr.constructor(arr) : new config.type(arr.length);

}

function removeFnTypePropArrs(geometry, attrName) {
    const geoProps = geometry.properties;
    delete geoProps[PREFIX + attrName + 'Index'];
    delete geoProps[PREFIX + attrName];
}

/**
 * 如果symbol中有function-type，则根据需要更新属性
 * @param {Object} config
 * @param {Array} meshes
 */
export function updateGeometryFnTypeAttrib(regl, symbolDef, config, meshes, z) {
    for (let i = 0; i < meshes.length; i++) {
        updateOneGeometryFnTypeAttrib(regl, symbolDef, config, meshes[i], z);
    }
}

export function updateOneGeometryFnTypeAttrib(regl, symbolDef, configs, mesh, z) {
    if (!mesh) {
        return;
    }
    const geometry = mesh.geometry;
    if (!geometry) {
        return;
    }
    for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        const { attrName, evaluate, define } = config;
        const aIndex = geometry.properties[PREFIX + attrName + 'Index'];
        if (!symbolChanged(geometry, symbolDef, config)) {
            const { aPickingId } = geometry.properties;
            if (!aPickingId || !aIndex) {
                continue;
            }
            if (geometry._fnDataZoom === z) {
                continue;
            }
            //fn-type的二级stops与zoom有关，更新数据
            updateFnTypeAttrib(attrName, geometry, aIndex, evaluate);
            continue;
        }
        // debugger
        //symbol有变化，需要删除原有的arr重新生成
        if (geometry.data[attrName]) {
            const arr = geometry.data[attrName];
            if (arr && arr.buffer && arr.buffer.destroy) {
                arr.buffer.destroy();
            }
            delete geometry.data[attrName];
        }
        // debugger
        const arr = prepareAttr(geometry, symbolDef, config);
        if (!arr) {
            //原有的arr和define要删除
            if (define) {
                const defines = mesh.defines;
                if (defines[define]) {
                    delete defines[define];
                    mesh.setDefines(defines);
                }
            }
        } else {
            //增加了新的fn-type arr，相应的需要增加define
            updateFnTypeAttrib(attrName, geometry, aIndex, evaluate);
            if (define) {
                const defines = mesh.defines;
                defines[define] = 1;
                mesh.setDefines(defines);
            }
            geometry.generateBuffers(regl);
        }
    }
    geometry._fnDataZoom = z;
}

function symbolChanged(geometry, symbolDef, config) {
    const value = symbolDef[config.symbolName];
    const savedTypes = geometry[SAVED_FN_TYPE];
    if (value !== savedTypes[config.symbolName]) {
        savedTypes[config.symbolName] = value;
        return true;
    }
    return false;
}

function isFnTypeFeature(feature, property, stopValues) {
    for (let i = 0; i < stopValues.length; i++) {
        if (property[0] === '$' && feature[property.substring(1)] === stopValues[i] ||
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
function createFnTypeFeatureIndex(features, aPickingId, property, stopValues, hasFnTypeInProperty) {
    const aIndex = [];
    let start = 0;
    let current = aPickingId[0];
    for (let ii = 1, l = aPickingId.length; ii < l; ii++) {
        if (aPickingId[ii] !== current || ii === l - 1) {
            if (hasFnTypeInProperty || isFnTypeFeature(features[current].feature, property, stopValues)) {
                aIndex.push(start, ii === l - 1 ? l : ii);
            }
            current = aPickingId[ii];
            start = ii;
        }
    }
    return aIndex;
}

const EMPTY_ARR = [];
/**
 * 检查第二层stops中是否存在与zoom有关的fn-type (zoom变化后需要更新)
 * @param {Array} stops
 */
function getFnTypePropertyStopValues(stops) {
    if (!stops) {
        return EMPTY_ARR;
    }
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
    let arr;
    if (aIndex) {
        //二级stops存在与zoom有关的fn-type
        arr = geometry.properties[PREFIX + attrName];
        const len = arr.length / aPickingId.length;
        const l = aIndex.length;
        for (let i = 0; i < l; i += 2) {
            const start = aIndex[i];
            const end = aIndex[i + 1];
            let feature = features[aPickingId[start]];
            if (!feature || !feature.feature) {
                continue;
            }
            evaluateAndUpdate(arr, feature, evaluate, start, end, len, geometry);
        }
    } else {
        //存在fn-type，但symbol更新过，要重新计算arr里的值
        arr = geometry.data[attrName];
        arr.dirty = true;
        const len = arr.length / aPickingId.length;
        const l = aPickingId.length;
        let start = 0;
        for (let i = 0; i < l; i++) {
            if (aPickingId[i] === aPickingId[start] && i < l - 1) {
                continue;
            }
            let feature = features[aPickingId[start]];
            if (feature && feature.feature) {
                evaluateAndUpdate(arr, feature, evaluate, start, i === l - 1 ? l : i, len, geometry);
                start = i;
            }
        }
    }
    if (arr.dirty) {
        geometry.updateData(attrName, arr);
        arr.dirty = false;
    }
}

function evaluateAndUpdate(arr, feature, evaluate, start, end, len, geometry) {
    feature = feature.feature;
    const properties = feature.properties || {};
    if (properties['$layer'] === undefined) {
        if (!feature.properties) {
            feature.properties = properties;
        }
        properties['$layer'] = feature.layer;
        properties['$type'] = feature.type;
    }
    const value = evaluate(properties, arr[start * len], geometry);
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

export function isFnTypeSymbol(symbolProp) {
    return symbolProp && isFunctionDefinition(symbolProp) && symbolProp.property;
}

function checkIfIdentityZoomDependent(config, fnDef, geometry) {
    let { features } = geometry.properties;
    if (!Array.isArray(features)) {
        features = Object.values(features);
    }
    if (!features || !features.length) {
        return false;
    }
    const { symbolName } = config;
    if (!SYMBOLS_SUPPORT_IDENTITY_FN_TYPE[symbolName]) {
        return false;
    }
    const prop = fnDef.property;
    for (let i = 0; i < features.length; i++) {
        const fea = features[i] && features[i].feature;
        if (!fea) {
            continue;
        }
        const v = fea.properties && fea.properties[prop];
        if (!v) {
            continue;
        }
        if (isFunctionDefinition(v) && !interpolated(v).isZoomConstant) {
            return true;
        }
    }
    return false;
}
