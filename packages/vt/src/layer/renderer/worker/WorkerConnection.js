import * as maptalks from 'maptalks';
import { extend, uid, toJSON } from '../../../common/Util';
import IconRequestor from '../../../common/IconRequestor';
import { getVectorPacker } from '../../../packer/inject';

const { GlyphRequestor } = getVectorPacker();

// GeoJSONVectorLayer caches data in memory, should use a dedicated worker.
const dedicatedLayers = ['GeoJSONVectorTileLayer'];

export default class WorkerConnection extends maptalks.worker.Actor {

    constructor(workerKey, layer) {
        super(workerKey);
        const mapId = layer.getMap().id;
        this._layer = layer;
        this._mapId = mapId;
        this._workerLayerId = 'vt_' + uid();
        const type = layer.getJSONType();
        this._isDedicated = dedicatedLayers.indexOf(type) >= 0;
        this._dedicatedVTWorkers = {};
        this._iconRequestor = new IconRequestor({
            iconErrorUrl: layer.options['iconErrorUrl'],
            maxSize: layer.options['maxIconSize'],
            urlModifier: (url) => {
                const modifier = layer.getURLModifier();
                return modifier && modifier(url) || url;
            }
        });
        const useCharBackBuffer = !layer.getRenderer().isEnableWorkAround('win-intel-gpu-crash');
        this._glyphRequestor = new GlyphRequestor(fn => {
            layer.getMap().getRenderer().callInNextFrame(fn);
        }, layer.options['glyphSdfLimitPerFrame'], useCharBackBuffer);
    }

    initialize(cb) {
        cb(null);
    }

    addLayer(cb) {
        const layer = this._layer;
        const options = layer.getWorkerOptions() || {};
        const layerId = this._workerLayerId, type = layer.getJSONType();
        const data = {
            mapId: this._mapId,
            layerId,
            command: 'addLayer',
            params: {
                type: type,
                options: JSON.parse(JSON.stringify(options))
            }
        };
        if (this._isDedicated) {
            if (this._dedicatedVTWorkers[layerId] === undefined) {
                this._dedicatedVTWorkers[layerId] = this.getDedicatedWorker();
            }
            this.send(data, null, cb, this._dedicatedVTWorkers[layerId]);
        } else {
            this.broadcast(data, null, cb);
        }
    }

    abortTile(url, cb) {
        const layerId = this._workerLayerId;
        const data = {
            mapId: this._mapId,
            layerId,
            command: 'abortTile',
            params: {
                url
            }
        };
        if (this._isDedicated) {
            if (this._dedicatedVTWorkers[layerId] === undefined) {
                this._dedicatedVTWorkers[layerId] = this.getDedicatedWorker();
            }
            this.send(data, null, cb, this._dedicatedVTWorkers[layerId]);
        } else {
            this.broadcast(data, null, cb);
        }
    }

    removeLayer(cb) {
        const layerId = this._workerLayerId;
        const data = {
            mapId: this._mapId,
            layerId,
            command: 'removeLayer'
        };
        if (this._isDedicated) {
            if (this._dedicatedVTWorkers[layerId] !== undefined) {
                this.send(data, null, cb, this._dedicatedVTWorkers[layerId]);
            }
            delete this._dedicatedVTWorkers[layerId];
        } else {
            this.broadcast(data, null, cb);
        }
    }

    updateStyle(style, cb) {
        const layerId = this._workerLayerId;
        const data = {
            mapId: this._mapId,
            layerId,
            command: 'updateStyle',
            params: JSON.parse(JSON.stringify(style))
        };
        if (this._isDedicated) {
            if (this._dedicatedVTWorkers[layerId] !== undefined) {
                this.send(data, null, cb, this._dedicatedVTWorkers[layerId]);
            }
        } else {
            this.broadcast(data, null, cb);
        }
    }

    updateOptions(options, cb) {
        const layerId = this._workerLayerId;
        const data = {
            mapId: this._mapId,
            layerId,
            command: 'updateOptions',
            params: JSON.parse(JSON.stringify(options))
        };
        if (this._isDedicated) {
            if (this._dedicatedVTWorkers[layerId] !== undefined) {
                this.send(data, null, cb, this._dedicatedVTWorkers[layerId]);
            }
        } else {
            this.broadcast(data, null, cb);
        }
    }

    //send(layerId, command, data, buffers, callback, workerId)
    loadTile(context, cb) {
        const params = extend({}, context);
        params.tileInfo = toJSON(context.tileInfo);
        const layerId = this._workerLayerId;
        const data = {
            mapId: this._mapId,
            layerId,
            command: 'loadTile',
            params
        };
        const { x, y } = context.tileInfo;
        const length = this.workers.length;
        const s = (x + y) % length;
        const buffers = [];
        const tileArrayBuffer = params.tileArrayBuffer;
        if (tileArrayBuffer && tileArrayBuffer instanceof ArrayBuffer) {
            buffers.push(tileArrayBuffer);
        }
        this.send(data, buffers, cb, this._dedicatedVTWorkers[layerId] === undefined ? this.workers[s].id : this._dedicatedVTWorkers[layerId]);
    }

    remove() {
        super.remove();
        this._dedicatedVTWorkers = {};
    }

    fetchIconGlyphs({ icons, glyphs }, cb) {
        //error, data, buffers
        this._glyphRequestor.getGlyphs(glyphs, (err, glyphData) => {
            if (err) {
                throw err;
            }
            const dataBuffers = glyphData.buffers || [];
            this._iconRequestor.getIcons(icons, (err, data) => {
                if (err) {
                    throw err;
                }
                if (data.buffers && data.buffers.length) {
                    dataBuffers.push(...data.buffers);
                }
                cb(null, { icons: data.icons, glyphs: glyphData.glyphs }, dataBuffers);
            });
        });

        //error, data, buffers

    }

    setData(geojson, cb) {
        const layerId = this._workerLayerId;
        const data = {
            mapId: this._mapId,
            layerId,
            command: 'setData',
            params: {
                data: geojson
            }
        };
        this.send(data, null, cb, this._dedicatedVTWorkers[layerId]);
    }

    _getTileKey(tileInfo) {
        return tileInfo.id;
    }
}
