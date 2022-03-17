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
