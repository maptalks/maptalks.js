import LayerWorker from './BaseLayerWorker';
import pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import Ajax from '../util/Ajax';
import { hasOwn, isString } from '../../common/Util';
import { PROP_OMBB } from '../../common/Constant';
import { projectOMBB } from '../builder/Ombb.js';

export default class VectorTileLayerWorker extends LayerWorker {
    constructor(id, options, uploader, cache, loadings, callback) {
        super(id, options, uploader, cache, loadings);
        options = options || {};
        callback();
    }

    /**
     * Load a tile, paint and return gl directives
     * @param {Object} tileInfo  - tileInfo, url, xyz, res, extent, etc
     * @param {Function} cb      - callback function when finished
     */
    getTileFeatures(context, cb) {
        const url = context.tileInfo.url;
        const fetchOptions = context.fetchOptions || {};
        if (this._cache.has(url)) {
            const { err, data } = this._cache.get(url);
            // setTimeout是因为该方法需要返回对象，否则BaseLayerWorker中的this.requests没有缓存，导致BaseLayerWorker不执行回调逻辑
            return setTimeout(() => {
                this._readTile(url, err, data, cb);
            }, 1);
        }
        fetchOptions.referrer = context.referrer;
        return Ajax.getArrayBuffer(url, fetchOptions, (err, response) => {
            if (!this._cache) {
                // removed
                return;
            }
            if (err) {
                if (!err.loading) {
                    this._cache.add(url, { err, data: response && response.data });
                }
            } else if (response && response.data) {
                this._cache.add(url, { err: null, data: response.data });
            }

            this._readTile(url, err, response && response.data, cb);
        });
    }

    _readTile(url, err, data, cb) {
        if (err) {
            cb(err);
            return;
        }
        let tile;
        try {
            tile = new VectorTile(new pbf(data));
        } catch (err) {
            cb(err.message, [], []);
            return;
        }
        const features = [];
        if (!tile.layers) {
            cb(null, features, []);
            return;
        }
        const layers = {};
        let feature;
        for (const layer in tile.layers) {
            if (hasOwn(tile.layers, layer)) {
                layers[layer] = {
                    types: {}
                };
                const types = layers[layer].types;
                for (let i = 0, l = tile.layers[layer].length; i < l; i++) {
                    try {
                        feature = tile.layers[layer].feature(i);
                        types[feature.type] = 1;
                        // feature.properties['$layer'] = layer;
                        // feature.properties['$type'] = feature.type;
                        const fea = {
                            type: feature.type,
                            layer: layer,
                            geometry: feature.loadGeometry(),
                            properties: feature.properties,
                            extent: feature.extent
                        };
                        if (feature.id !== undefined) {
                            fea.id = feature.id;
                        }
                        let ombb = fea.properties[PROP_OMBB];
                        if (ombb) {
                            if (isString(ombb)) {
                                ombb = JSON.parse(ombb);
                            }
                            fea.properties[PROP_OMBB] = projectOMBB(ombb, 'EPSG:3857');
                        }
                        features.push(fea);
                    } catch (err) {
                        console.warn('error when load vt geometry:', err);
                    }

                }
            }
        }

        for (const p in layers) {
            layers[p].types = Object.keys(layers[p].types).map(t => +t);
        }

        cb(null, features, layers, { byteLength: data.byteLength });
    }

    abortTile(url, cb) {
        const xhr = this.requests[url];
        delete this.requests[url];
        //需要先从requests中删除url，再abort，触发cancel逻辑, 否则会被当成xhr的error处理掉
        if (xhr && xhr.abort) {
            xhr.abort();
        }
        this._cancelLoadings(url);
        cb();
    }

    onRemove() {
        super.onRemove();
        for (const url in this.requests) {
            const xhr = this.requests[url];
            if (xhr && xhr.abort) {
                xhr.abort();
            }
        }
        this.requests = {};
    }
}
