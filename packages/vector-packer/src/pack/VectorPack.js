import convert from './util/convert';

/**
 * abstract class for all vector packs
 */
export default class VectorPack {
    constructor(features, styles) {
        this.features = this._check(features);
        this.styles = styles;
    }

    _check(features) {
        if (!features.length) {
            return features;
        }
        const first = features[0];
        if (Array.isArray(first.geometry) && first.properties) {
            return features;
        }
        const checked = [];
        if (first.tags) {
            //TODO geojson-vt转化的feature转成vt feature
        } else {
            for (const feature of features) {
                const feas = convert(feature);
                for (const fea of feas) {
                    checked.push(fea);
                }
            }
        }
        return checked;
    }

}
