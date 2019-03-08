import LayerWorker from './BaseLayerWorker';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import Ajax from '../util/Ajax';

export default class VectorLayerWorker extends LayerWorker {
    constructor(id, options, uploader, callback) {
        super(id, options, uploader);
        options = options || {};
        this._requests = {};
        callback();
    }

    /**
     * Load a tile, paint and return gl directives
     * @param {Object} tileInfo  - tileInfo, url, xyz, res, extent, etc
     * @param {Function} cb      - callback function when finished
     */
    getTileFeatures(tileInfo, cb) {
        const url = tileInfo.url;
        this._requests[url] = Ajax.getArrayBuffer(url, (err, response) => {
            delete this._requests[url];
            if (err) {
                cb(err);
                return;
            }
            const tile = new VectorTile(new Pbf(response.data));
            const features = [];
            if (!tile.layers) {
                cb(null, features, []);
                return;
            }
            const types = {};
            let feature;
            for (const layer in tile.layers) {
                if (tile.layers.hasOwnProperty(layer)) {
                    for (let i = 0, l = tile.layers[layer].length; i < l; i++) {
                        feature = tile.layers[layer].feature(i);
                        types[layer] = feature.type;
                        features.push({
                            type : feature.type,
                            layer : layer,
                            geometry : feature.loadGeometry(),
                            properties : feature.properties,
                            extent : feature.extent
                        });
                    }
                }
            }
            const layers = Object.keys(tile.layers);
            cb(null, features, layers.map(l => {
                return { 'layer': l, 'type': types[l] };
            }));
        });
    }

    abortTile(url, cb) {
        if (url && this._requests[url]) {
            this._requests[url].abort();
            delete this._requests[url];
        }
        cb();
    }

    onRemove() {
        for (const url in this._requests) {
            this._requests[url].abort();
        }
        this._requests = {};
    }
}
