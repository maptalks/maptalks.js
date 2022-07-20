import * as maptalks from 'maptalks';

export default class TerrainWorkerConnection extends maptalks.worker.Actor {
    constructor(mapId) {
        super('@maptalks/terrain');
        this.mapId = mapId;
    }

    fetchTerrain(url, options, cb) {
        const data = {
            url,
            origin: location.origin,
            exaggeration: options.exaggeration,
            type: options.type,
            accessToken: options.accessToken
        };
        this.send(data, null, (err, data) => {
            if (err) {
                cb(err);
                return;
            }
            cb(err, data);
        });
    }

    addLayer(layerId, options, cb) {
        const data = {
            actorId: this.actorId,
            mapId : this.mapId,
            layerId,
            command : 'addLayer',
            params : {
                options
            }
        };

        this.broadcast(data, null, cb);
    }

    removeLayer(layerId, options, cb) {
        const data = {
            mapId : this.mapId,
            layerId,
            command : 'removeLayer'
        };
        this.broadcast(data, null, cb);
    }
}
