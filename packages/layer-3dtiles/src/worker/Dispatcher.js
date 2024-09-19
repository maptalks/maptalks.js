import LayerWorker from './LayerWorker.js';

let callbackId = 0;

export default class Dispatcher {

    constructor(workerId) {
        this.workerId = workerId;
        this.workers = {};
        this._callbacks = {};
    }

    /**
     * Add a layer, create a layer worker
     * @param {String} mapId    - map id
     * @param {String} layerId  - layer id
     * @param {object} params   - parameters
     * @param {Object} options  - layer initialization options
     * @param {Function} cb - callback function
     */
    addLayer({ actorId, mapId, layerId, params }, cb) {
        const layer = this._getLayerById(mapId, layerId);
        if (layer) {
            return;
        }
        const key = this._genKey(mapId, layerId);
        const options = params.options;
        // debugger
        const uploader = (...args) => {
            return this.send.call(this, actorId, ...args);
        };
        this.workers[key] = new LayerWorker(layerId, options, uploader, cb);
    }

    /**
     * Remove a layer
     * @param {String} mapId    - map id
     * @param {String} layerId  - layer id
     * @param {Function} cb - callback function
     */
    removeLayer({ mapId, layerId }, cb) {
        const layer = this._getLayerById(mapId, layerId);
        const key = this._genKey(mapId, layerId);
        delete this.workers[key];
        if (layer) {
            layer.onRemove(cb);
        }
    }

    /**
     * Load a tileset json or a b3dm tile
     * @param {String} mapId    - map id
     * @param {String} layerId  - layer id
     * @param {Object} params   - params
     * @param {Function} cb - callback function
     */
    loadTile({ mapId, layerId, params }, cb) {
        const layer = this._getLayerById(mapId, layerId);
        if (layer) {
            layer.loadTile(params, cb);
        }
    }


    abortTileLoading({ mapId, layerId, params }, cb) {
        const layer = this._getLayerById(mapId, layerId);
        if (layer) {
            layer.abortTileLoading(params, cb);
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
        return this.workers[key];
    }
}
