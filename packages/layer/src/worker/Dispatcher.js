import GeoJSONLayerWorker from './layer/GeojsonLayerWorker';
import VectorLayerWorker from './layer/VectorLayerWorker';

export default class Dispatcher {

    constructor() {
        this.layers = {};
    }

    /**
     * Add a layer, create a layer worker
     * @param {String} mapId    - map id
     * @param {String} layerId  - layer id
     * @param {String} type     - layer type, geojson or server
     * @param {Object} options  - layer initialization options
     * @param {Function} callback - callback function
     */
    addLayer({ mapId, layerId, params }, callback) {
        const layer = this._getLayerById(mapId, layerId);
        if (layer) {
            return;
        }
        const key = this._genKey(mapId, layerId);
        const type = params.type;
        const options = params.options;
        if (type === 'GeoJSONVectorTileLayer') {
            this.layers[key] = new GeoJSONLayerWorker(layerId, options, callback);
        } else if (type === 'VectorTileLayer') {
            this.layers[key] = new VectorLayerWorker(layerId, options, callback);
        }
    }

    /**
     * Remove a layer
     * @param {String} mapId    - map id
     * @param {String} layerId  - layer id
     * @param {Function} callback - callback function
     */
    removeLayer({ mapId, layerId }, callback) {
        const layer = this._getLayerById(mapId, layerId);
        const key = this._genKey(mapId, layerId);
        delete this.layers[key];
        if (layer) {
            layer.onRemove(callback);
        }
    }

    /**
     * Load a tile, return webgl directives
     * @param {String} mapId    - map id
     * @param {String} layerId  - layer id
     * @param {Object} params   - params
     * @param {Function} callback - callback function
     */
    loadTile({ mapId, layerId, params }, callback) {
        const layer = this._getLayerById(mapId, layerId);
        if (layer) {
            layer.loadTile(params.tile, callback);
        }
    }

    /**
     * Remove a tile from the worker
     * @param {String} mapId    - map id
     * @param {String} layerId  - layer id
     * @param {Object} params   - params
     * @param {Function} callback - callback function
     */
    removeTile({ mapId, layerId, params }, callback) {
        const layer = this._getLayerById(mapId, layerId);
        if (layer) {
            layer.removeTile(params, callback);
        }
    }

    updateStyle({ mapId, layerId, params }, callback) {
        const layer = this._getLayerById(mapId, layerId);
        if (layer) {
            layer.updateStyle(params, callback);
        }
    }

    _genKey(mapId, layerId) {
        return `${mapId}-${layerId}`;
    }

    _getLayerById(mapId, layerId) {
        const key = this._genKey(mapId, layerId);
        return this.layers[key];
    }
}
