import { isNil, fillArray, isArray } from '../../Util';
import { externalPropsKey } from '../../../renderer/utils/convert_to_painter_features';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';
import { isObjectEmpty } from './is_obj_empty';
import deepEqual from 'fast-deep-equal';
import { getVectorPacker } from '../../../../packer/inject';

const { StyleUtil } = getVectorPacker();

export const PREFIX = '_fn_type_';


const SAVED_FN_TYPE = '__current_fn_types';
/**
 * 如果 symbolDef 有 function-type 类型，则准备需要的数据
 * @param {*} geometry
 * @param {*} features
 * @param {*} symbolDef
 * @param {*} configs
 */
export function prepareFnTypeData(geometry, symbolDef, configs, layer) {
    const features = geometry.properties.features;
    if (isObjectEmpty(features)) {
        return;
    }
    for (let i = 0; i < configs.length; i++) {
        const { symbolName } = configs[i];
        const savedTypes = geometry[SAVED_FN_TYPE] = geometry[SAVED_FN_TYPE] || {};
        savedTypes[symbolName] = symbolDef[symbolName];
        prepareAttr(geometry, symbolDef, configs[i], layer);
    }
}

function prepareAttr(geometry, symbolDef, config, layer) {
    // 因为symbol有可能被更新为fn-type，aPickingId 是必须保存的
    const aPickingId = preparePickingId(geometry);
    const { attrName, symbolName, related } = config;
    let arr = geometry.data[attrName];
    if (!arr) {
        if (!isFnTypeSymbol(symbolDef[symbolName])) {
            return null;
        } else {
            //symbol是fn-type，但arr不存在，则创建
            arr = geometry.data[attrName] = new config.type(config.width * aPickingId.length);
            updateAttrValue(arr, geometry, symbolDef, config, layer);
            return arr;
        }
    } else if (!isFnTypeSymbol(symbolDef[symbolName]) && !hasRelatedFnTypeSymbol(related, symbolDef)) {
        //symbol不是fn-type，但存在attr，则删除arr和aIndex
        // if (arr && arr.buffer && arr.buffer.destroy) {
        //     arr.buffer.destroy();
        // }
        // delete geometry.data[attrName];
        geometry.deleteData(attrName);
        removeFnTypePropArrs(geometry, attrName);
        return null;
    }
    if (isFnTypeSymbol(symbolDef[symbolName])) {
        createZoomFnTypeIndexData(geometry, symbolDef, config);
    }
    return arr;
}

function preparePickingId(geometry) {
    const geoProps = geometry.properties;
    let aPickingId = geoProps.aPickingId;
    if (!aPickingId) {
        aPickingId = geoProps.aPickingId = new geometry.data.aPickingId.constructor(geometry.data.aPickingId);
    }
    return aPickingId;
}

function updateAttrValue(arr, geometry, symbolDef, config, layer) {
    const { attrName } = config;
    const aIndexPropName = (PREFIX + attrName + 'Index').trim();
    //symbol是fn-type，但arr不存在，则创建
    createZoomFnTypeIndexData(geometry, symbolDef, config);
    const aIndex = geometry.properties[aIndexPropName];
    updateFnTypeAttrib(geometry, aIndex, config, layer);
    return arr;
}

/**
 * 检查config中属性，fntype的stops中是否存在与zoom有关的fn-type 或者 identity fn-type
 * 如果有，则创建受影响的feature索引，方便地图zoom时更新属性
 *
 * */
function createZoomFnTypeIndexData(geometry, symbolDef, config) {
    const { attrName, symbolName } = config;
    const geoProps = geometry.properties;
    const aIndexPropName = (PREFIX + attrName + 'Index').trim();
    const attrPropName = (PREFIX + attrName).trim();
    if (geoProps[aIndexPropName] && geoProps[attrPropName]) {
        // 如果index已经存在说明已经在别的属性里创建过了，例如lineDx和lineDy共享了aLineDxDy时
        return;
    }
    const stopValues = getFnTypePropertyStopValues(symbolDef[symbolName].stops);
    const isIdentityFn = symbolDef[symbolName].type === 'identity';
    // symbol是identity类型，且属性支持 fn type 值
    // TODO 这里应该遍历features，检查是否有 fn type 的值
    const hasZoomIdentity = isIdentityFn && StyleUtil.checkIfIdentityZoomDependent(symbolName, symbolDef[symbolName].property, geoProps.features);
    if (!hasZoomIdentity && !stopValues.length) {
        //说明stops中没有function-type类型
        removeFnTypePropArrs(geometry, attrName);
        return;
    }

    const { features, aPickingId } = geoProps;
    const aIndex = createFnTypeFeatureIndex(features, aPickingId, symbolDef[symbolName].property, stopValues, hasZoomIdentity);
    if (!aIndex.length) {
        //说明瓦片中没有 function-type 中涉及的 feature
        removeFnTypePropArrs(geometry, attrName);
        return;
    }
    const arr = geometry.data[attrName];

    geoProps[aIndexPropName] = aIndex;
    geoProps[attrPropName] = arr.BYTES_PER_ELEMENT ? new arr.constructor(arr) : new config.type(arr.length);

}

function removeFnTypePropArrs(geometry, attrName) {
    const geoProps = geometry.properties;
    const aIndexPropName = (PREFIX + attrName + 'Index').trim();
    const attrPropName = (PREFIX + attrName).trim();
    delete geoProps[aIndexPropName];
    delete geoProps[attrPropName];
}

/**
 * 如果symbol中有function-type，则根据需要更新属性
 * @param {Object} config
 * @param {Array} meshes
 */
export function updateGeometryFnTypeAttrib(regl, layer, symbolDef, config, meshes, z) {
    for (let i = 0; i < meshes.length; i++) {
        updateOneGeometryFnTypeAttrib(regl, layer, symbolDef, config, meshes[i], z);
    }
}

export function updateOneGeometryFnTypeAttrib(regl, layer, symbolDef, configs, mesh, z) {
    if (!mesh) {
        return;
    }
    const geometry = mesh.geometry;
    if (!geometry) {
        return;
    }
    const features = geometry.properties.features;
    if (isObjectEmpty(features)) {
        return;
    }
    // const layer = mesh.geometry.properties.layer;
    for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        const attrName = config.attrName;
        if (!symbolChanged(geometry, symbolDef, config) && (!layer._isFeatureStateDirty || !layer._isFeatureStateDirty(mesh.geometry._featureTimestamp))) {
            const { aPickingId } = geometry.properties;
            if (!aPickingId || geometry._fnDataZoom === z) {
                continue;
            }
            const aIndexPropName = (PREFIX + attrName + 'Index').trim();
            const aIndex = geometry.properties[aIndexPropName];
            if (!aIndex) {
                continue;
            }
            //fn-type的二级stops与zoom有关，更新数据
            updateFnTypeAttrib(geometry, aIndex, config, layer);
            continue;
        }
        // debugger
        //symbol有变化，需要删除原有的arr重新生成
        // if (geometry.data[attrName]) {
        //     const arr = geometry.data[attrName];
        //     if (arr && arr.buffer && arr.buffer.destroy) {
        //         arr.buffer.destroy();
        //     }
        //     delete geometry.data[attrName];
        // }
        // debugger
        const arr = prepareAttr(geometry, symbolDef, config);
        const define = config.define;
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
            const aIndexPropName = (PREFIX + attrName + 'Index').trim();
            const aIndex = geometry.properties[aIndexPropName];
            //增加了新的fn-type arr，相应的需要增加define
            updateFnTypeAttrib(geometry, aIndex, config, layer);
            if (layer._getFeatureStateStamp) {
                geometry._featureTimestamp = layer._getFeatureStateStamp();
            }
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
    if (!deepEqual(value, savedTypes[config.symbolName])) {
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
        if (features[current] && (aPickingId[ii] !== current || ii === l - 1)) {
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
function updateFnTypeAttrib(geometry, aIndex, config, layer) {
    const { attrName, evaluate } = config;
    const { aPickingId, features } = geometry.properties;
    let arr;
    if (aIndex) {
        //二级stops存在与zoom有关的fn-type
        const attrProp = (PREFIX + attrName).trim();
        arr = geometry.properties[attrProp];
        const len = arr.length / aPickingId.length;
        const l = aIndex.length;
        for (let i = 0; i < l; i += 2) {
            const start = aIndex[i];
            const end = aIndex[i + 1];
            let feature = features[aPickingId[start]];
            if (!feature || !feature.feature) {
                continue;
            }
            evaluateAndUpdate(arr, feature, evaluate, start, end, len, geometry, layer);
        }
    } else {
        //存在fn-type，但symbol更新过，要重新计算arr里的值
        arr = geometry.data[attrName];
        if (isArray(arr)) {
            arr.dirty = true;
        } else {
            const keyName = (PREFIX + attrName).trim();
            arr = geometry.properties[keyName];
            if (!arr) {
                arr = geometry.properties[keyName] = new config.type(config.width * aPickingId.length);
                arr.dirty = true;
            }
        }

        const len = arr.length / aPickingId.length;
        const l = aPickingId.length;
        let start = 0;
        for (let i = 0; i < l; i++) {
            if (aPickingId[i] === aPickingId[start] && i < l - 1) {
                continue;
            }
            let feature = features[aPickingId[start]];
            if (feature && feature.feature) {
                evaluateAndUpdate(arr, feature, evaluate, start, i === l - 1 ? l : i, len, geometry, layer);
                start = i;
            }
        }
    }
    if (arr.dirty) {
        geometry.updateData(attrName, arr);
        arr.dirty = false;
    }
}

const SOURCE = {};
function evaluateAndUpdate(arr, feature, evaluate, start, end, len, geometry, layer) {
    feature = feature.feature;
    const properties = feature.properties || {};
    if (properties['$layer'] === undefined) {
        if (!feature.properties) {
            feature.properties = properties;
        }
        properties['$layer'] = feature.layer;
        properties['$type'] = feature.type;
    }
    if (layer.getFeatureState) {
        SOURCE.layer = feature.layer;
        SOURCE.id = feature.id;
        if (feature[externalPropsKey]) {
            feature[externalPropsKey] = null;
        }
        if (!isNil(feature.id)) {
            const states = layer.getFeatureState(SOURCE);
            feature.properties[externalPropsKey] = states;
        }
    }

    const value = evaluate(properties, geometry, arr, start * len);
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
    return StyleUtil.isFnTypeSymbol(symbolProp);
}


function hasRelatedFnTypeSymbol(related, symbolDef) {
    if (!Array.isArray(related)) {
        return false;
    }
    for (let i = 0; i < related.length; i++) {
        if (isFnTypeSymbol(symbolDef[related[i]])) {
            return true;
        }
    }
    return false;
}
