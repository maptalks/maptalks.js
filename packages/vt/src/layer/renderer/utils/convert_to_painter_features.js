import { KEY_IDX } from '../../../common/Constant';

const KEY_IDX_NAME = (KEY_IDX + '').trim();

// feaIndexes是VectorTileLayer中设置过filter时，符合条件的feature的编号，可以为null
export default function convertToPainterFeatures(features, feaIndexes, layerId, symbol, layer) {
    const pluginFeas = {};
    if (hasFeature(features)) {
        const data = feaIndexes || features;
        //[feature index, style index]
        for (let ii = 0, ll = data.length; ii < ll; ii++) {
            let feature = feaIndexes ? features[feaIndexes[ii]] : features[ii];
            if (layer.options['features'] === 'id' && layer.getFeature) {
                feature = layer.getFeature(feature);
                feature.layer = layerId;
            }
            if (feature.customProps) {
                feature = proxyFea(feature);
            }
            const keyIdxValue = feaIndexes ? feaIndexes[ii] : feature[KEY_IDX_NAME];
            pluginFeas[keyIdxValue] = {
                feature,
                symbol
            };
        }
    }
    return pluginFeas;
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

const proxyGetter = {
    get: function(obj, prop) {
        return prop in obj ? obj[prop] : obj[oldPropsKey][prop];
    }
};

const EMPTY_PROPS = {};

function proxyFea(feature) {
    const originalProperties = feature.properties;
    if (originalProperties && originalProperties[oldPropsKey]) {
        return feature;
    }
    const properties = feature.customProps;
    properties[oldPropsKey] = originalProperties || EMPTY_PROPS;
    feature.properties = new Proxy(properties, proxyGetter);
    return feature;
}
