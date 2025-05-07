import * as maptalks from 'maptalks';

export default class TerrainWorkerConnection extends maptalks.worker.Actor {
    constructor(mapId) {
        super('@maptalks/terrain');
        this.mapId = mapId;
    }

    checkUrl(url) {
        if (!url || !maptalks.Util.isString(url)) {
            return url;
        }
        //The URL is processed. Here, only the relative protocol is processed
        return maptalks.Util.getAbsoluteURL(url);

    }

    fetchTerrain(url, options, cb) {
        url = this.checkUrl(url);
        const tileImage = options.tileImage;
        const data = {
            actorId: this.actorId,
            mapId: this.mapId,
            command: 'fetchTerrain',
            params: {
                url,
                origin: location.origin,
                terrainWidth: options.terrainWidth,
                type: options.type,
                accessToken: options.accessToken,
                cesiumIonTokenURL: options.cesiumIonTokenURL,
                error: options.error,
                colors: options.colors,
                tileSize: options.tileSize,
                tileImage
            }
        };
        const buffers = [];
        if (tileImage) {
            buffers.push(tileImage);
        }
        this.send(data, buffers, (err, data) => {
            if (err) {
                cb(err);
                return;
            }
            cb(err, data);
        });
    }

    abortTerrain(url, cb) {
        const data = {
            actorId: this.actorId,
            mapId: this.mapId,
            command: 'abortTerrain',
            params: {
                url
            }
        };
        this.broadcast(data, null, cb);
    }

    addLayer(layerId, options, cb) {
        const data = {
            actorId: this.actorId,
            mapId: this.mapId,
            layerId,
            command: 'addLayer',
            params: {
            }
        };

        this.broadcast(data, null, cb);
    }

    createTerrainMesh(params, cb) {
        const data = {
            actorId: this.actorId,
            command: 'createTerrainMesh',
            params
        };
        this.send(data, [params.terrainHeights.data.buffer], (err, data) => {
            if (err) {
                cb(err);
                return;
            }
            cb(err, data);
        });
    }

    removeLayer(layerId, options, cb) {
        const data = {
            mapId: this.mapId,
            layerId,
            command: 'removeLayer'
        };
        this.broadcast(data, null, cb);
    }
}
