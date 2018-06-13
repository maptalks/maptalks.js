import * as maptalks from 'maptalks';
import { toJSON } from '../../core/Util';

// GeoJSONVectorLayer caches data in memory, should use a dedicated worker.
const dedicatedLayers = ['GeoJSONVectorTileLayer'];

export default class WorkerConnection extends maptalks.worker.Actor {

    constructor(workerKey, mapId) {
        super(workerKey);
        this.mapId = mapId;
        this.dedicatedWorkers = {};
    }

    initialize(cb) {
        cb(null);
        // if (this.workerPool._vtInitialized) {
        //     cb(null);
        //     return;
        // }
        // this.workerPool._vtInitialized = true;
        // this.broadcast({
        //     command : 'initialize',
        //     params : {
        //         plugins : this.plugins
        //     }
        // }, null, err => {
        //     cb(err);
        // });
    }

    addLayer(layerId, type, options, cb) {
        const data = {
            mapId : this.mapId,
            layerId,
            command : 'addLayer',
            params : {
                type : type,
                options : options
            }
        };
        if (dedicatedLayers.indexOf(type) >= 0) {
            if (!this.dedicatedWorkers[layerId]) {
                this.dedicatedWorkers[layerId] = this.getDedicatedWorker();
            }
            this.send(data, null, cb, this.dedicatedWorkers[layerId]);
        } else {
            this.broadcast(data, null, cb);
        }
    }

    removeLayer(layerId, cb) {
        const data = {
            mapId : this.mapId,
            layerId,
            command : 'removeLayer'
        };
        if (this.dedicatedWorkers[layerId]) {
            this.send(data, null, cb, this.dedicatedWorkers[layerId]);
            delete this.dedicatedWorkers[layerId];
        } else {
            this.broadcast(data, null, cb);
        }
    }

    updateStyle(layerId, style, cb) {
        const data = {
            mapId : this.mapId,
            layerId,
            command : 'updateStyle',
            params : style
        };
        if (this.dedicatedWorkers[layerId]) {
            this.send(data, null, cb, this.dedicatedWorkers[layerId]);
        } else {
            this.broadcast(data, null, cb);
        }
    }

    //send(layerId, command, data, buffers, callback, workerId)
    loadTile(layerId, context, cb) {
        const data = {
            mapId : this.mapId,
            layerId,
            command : 'loadTile',
            params : {
                tileInfo : toJSON(context.tileInfo),
                glScale : context.glScale,
                zScale : context.zScale
            }
        };
        this.send(data, null, cb, this.dedicatedWorkers[layerId]);
    }

    remove() {
        super.remove();
        this.dedicatedWorkers = [];
    }

    _getTileKey(tileInfo) {
        return tileInfo.id;
    }
}
