import GeoJSONLayerWorker from './layer/GeojsonLayerWorker';
import VectorLayerWorker from './layer/VectorLayerWorker';

let callbackId = 0;

export default class Dispatcher {

    constructor(workerId) {
        this._layers = {};
        this._callbacks = {};
        this.workerId = workerId;
    }

    /**
     * Add a layer, create a layer worker
     * @param {String} mapId    - map id
     * @param {String} layerId  - layer id
     * @param {String} type     - layer type, geojson or server
     * @param {Object} options  - layer initialization options
     * @param {Function} callback - callback function
     */
    addLayer({ actorId, mapId, layerId, params }, callback) {
        const layer = this._getLayerById(mapId, layerId);
        if (layer) {
            return;
        }
        const key = this._genKey(mapId, layerId);
        const type = params.type;
        const options = params.options;
        const uploader = this.send.bind(this, actorId);
        if (type === 'GeoJSONVectorTileLayer') {
            this._layers[key] = new GeoJSONLayerWorker(layerId, options, uploader, callback);
        } else if (type === 'VectorTileLayer') {
            this._layers[key] = new VectorLayerWorker(layerId, options, uploader, callback);
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
        delete this._layers[key];
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
            layer.loadTile(params, callback);
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

    /**
     * Receive response from main thread and call callback
     * @param {Object} data
     */
    receive(data) {
        const id = data.callback;
        const callback = this._callbacks[id];
        delete this._callbacks[id];
        if (callback && data.error) {
            callback(new Error(data.error));
        } else if (callback) {
            callback(null, data.data);
        }
    }

    /**
     * Send a request to main thread
     * @param {String} actorId - actor's id
     * @param {String} command - actor's method name to call
     * @param {Object} params - parameters
     * @param {ArrayBuffer[]} buffers - transferable buffers
     * @param {Function} callback - callback of main thread's reponse
     */
    send(actorId, command, params, buffers, callback) {
        const id = callback ? `${actorId}-${callbackId++}` : null;
        if (callback) this._callbacks[id] = callback;
        postMessage({
            type : '<request>',
            workerId : this.workerId,
            actorId,
            command,
            params,
            callback : String(id)
        }, buffers || []);
    }

    _genKey(mapId, layerId) {
        return `${mapId}-${layerId}`;
    }

    _getLayerById(mapId, layerId) {
        const key = this._genKey(mapId, layerId);
        return this._layers[key];
    }
}
