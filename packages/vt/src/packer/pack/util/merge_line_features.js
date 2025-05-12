import mergeLines from './merge_lines';
import { isString, isNil } from './util';

const IDX_PROP = '__index';

export default function mergeLineFeatures(features, symbolDef, fnTypes, zoom) {
    const keyName = (IDX_PROP + '').trim();
    const merging = getFeauresToMerge(features, symbolDef, fnTypes, zoom);
    if (merging.length) {
        const result = [];
        for (let i = 0; i < merging.length; i++) {
            if (!merging[i].property) {
                result.push(merging[i].features);
            } else {
                result.push(mergeLines(merging[i].features, merging[i].property));
            }
        }
        if (result.length === 1) {
            return result[0];
        } else {
            let mergedFeatures = [];
            for (let i = 0; i < result.length; i++) {
                mergedFeatures = mergedFeatures.concat(result[i]);
            }
            mergedFeatures.sort((a, b) => {
                return a[keyName] - b[keyName];
            });
            return mergedFeatures;
        }
    } else {
        return [];
    }
}



function getFeauresToMerge(features, symbolDef, fnTypes, zoom) {
    const keyName = (IDX_PROP + '').trim();
    const { mergeOnPropertyFn } = fnTypes;
    if (!symbolDef['mergeOnProperty']) {
        return [];
    }
    if (isString(symbolDef['mergeOnProperty'])) {
        return [{ features: features, property: symbolDef['mergeOnProperty'] }];
    }
    const result = [];
    const merging = {};
    const unMerged = [];
    for (let i = 0; i < features.length; i++) {
        features[i][keyName] = i;
        const properties = features[i].properties = features[i].properties || {};
        properties['$layer'] = features[i].layer;
        properties['$type'] = features[i].type;
        const property = mergeOnPropertyFn ? mergeOnPropertyFn(zoom, properties) : symbolDef['mergeOnProperty'];
        if (isNil(property)) {
            unMerged.push(features[i]);
            continue;
        }
        if (merging[property] === undefined) {
            merging[property] = result.length;
            result.push({
                features: [],
                property
            });
        }
        result[merging[property]].features.push(features[i]);
    }
    if (unMerged.length) {
        result.push({ features: unMerged });
    }
    return result;
}
