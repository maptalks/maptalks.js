// import * as maptalks from 'maptalks';
import { KEY_IDX } from '../../../common/Constant';
import { extend, isObject, isNil } from '../../../common/Util';

const KEY_IDX_NAME = (KEY_IDX + '').trim();

// feaIndexes是VectorTileLayer中设置过filter时，符合条件的feature的编号，可以为null
export default function convertToPainterFeatures(features, feaIndexes, layerId, symbol, layer) {
    const pluginFeas = {};
    if (hasFeature(features)) {
        const data = feaIndexes || features;
        //[feature index, style index]
        for (let ii = 0, ll = data.length; ii < ll; ii++) {
            let feature = feaIndexes ? features[feaIndexes[ii]] : features[ii];
            const isObj = feature && isObject(feature);
            let propertiesHasMerged = false;
            //is GeoJSONVectorTileLayer
            if (layer.getFeature && !isNil(feature)) {
                const featureId = isObj ? feature.id : feature;
                //query feature from main thread,it may be null
                const queryFeature = layer.getFeature(featureId);
                if (queryFeature) {
                    propertiesHasMerged = true;
                    //customProperties
                    let properties, customProps;
                    if (isObj) {
                        //get properties from worker data
                        properties = feature.properties;
                        customProps = feature.customProps;
                    }
                    feature = queryFeature;
                    feature.layer = layerId;
                    //merge properties
                    mergeFeatureProperties(feature, properties, customProps);
                }
            }
            if (!propertiesHasMerged) {
                if (isObj) {
                    const properties = feature.properties;
                    const customProps = feature.customProps;
                    //merge properties
                    mergeFeatureProperties(feature, properties, customProps);
                }
            }
            // if (layer instanceof maptalks.TileLayer) {
            //     feature = proxyFea(feature, copy);
            // }
            const keyIdxValue = feaIndexes ? feaIndexes[ii] : feature[KEY_IDX_NAME];
            pluginFeas[keyIdxValue] = {
                feature,
                symbol
            };
        }
    }
    return pluginFeas;
}

function mergeFeatureProperties(feature, properties, customProps) {
    if (properties || customProps) {
        feature.properties = feature.properties || {};
        //merge customProperties
        extend(feature.properties, properties || {}, customProps || {});
    }
}

function hasFeature(features) {
    if (!features) {
        return false;
    }

    for (const p in features) {
        if (features[p] !== undefined && features[p] !== null) {
            return true;
        }
    }
    return false;
}

export const oldPropsKey = '__original_properties';
export const externalPropsKey = '__external_properties';

const proxyGetter = {
    get: function (obj, prop) {
        return prop in obj ? obj[prop] : (obj[oldPropsKey][prop] || obj[externalPropsKey] && obj[externalPropsKey][prop]);
    },
    has: function (obj, prop) {
        return (prop in obj) || (prop in obj[oldPropsKey]) || obj[externalPropsKey] && (prop in obj[externalPropsKey]);
    }
};

const EMPTY_PROPS = {};

// eslint-disable-next-line no-unused-vars
function proxyFea(feature, copy) {
    const originalProperties = feature.properties;
    if (originalProperties && originalProperties[oldPropsKey]) {
        // 已经proxy过了
        return feature;
    }
    if (copy) {
        feature = extend({}, feature);
    }
    feature.customProps = feature.customProps || {};
    const properties = feature.customProps;
    properties['$layer'] = feature.layer;
    properties['$type'] = feature.type;
    properties[oldPropsKey] = originalProperties || EMPTY_PROPS;
    feature.properties = new Proxy(properties, proxyGetter);
    return feature;
}
