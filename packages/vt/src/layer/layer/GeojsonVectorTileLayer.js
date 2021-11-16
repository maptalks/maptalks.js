import * as maptalks from 'maptalks';
import VectorTileLayer from './VectorTileLayer';
import Ajax from '../../worker/util/Ajax';
import { isString } from '../../common/Util';

const options = {
    //feature data to return from worker
    //for geojson layer, only need to return id of features
    features: 'id',
    tileBuffer: 64,
    extent: 8192,
    pyramidMode: 1
};

class GeoJSONVectorTileLayer extends VectorTileLayer {

    constructor(id, options = {}) {
        // use map's spatial reference
        options.spatialReference = null;
        super(id, options);
        this.setData(options['data']);
    }

    getWorkerOptions() {
        const options = super.getWorkerOptions();
        let workerData = this.options.data;
        if (isString(workerData)) {
            workerData = toAbsoluteURL(workerData);
        } else {
            workerData = this.features;
        }
        options.data = workerData;
        options.tileBuffer = this.options.tileBuffer;
        options.extent = this.options.extent;
        return options;
    }

    setData(data) {
        this.options.data = data;
        if (data && (isString(data) || data.url)) {
            const renderInited = !!this.getRenderer();
            this._fetchData(data, (err, json) => {
                if (err) {
                    throw err;
                }
                this._setData(json);
                if (renderInited) {
                    this._updateWorker();
                }
            });
            return this;
        }
        this._setData(data);
        this._updateWorker();
        return this;
    }

    _setData(data) {
        if (this.options.convertFn) {
            const fn = new Function('data', this.options.convertFn + '\nreturn convert(data)');
            data = fn(data);
        }
        this.features = data;
        this._generateIdMap();

        return this;
    }

    _updateWorker() {
        const renderer = this.getRenderer();
        if (renderer) {
            const workerConn = renderer.getWorkerConnection();
            if (workerConn) {
                let workerData = this.options.data;
                if (isString(workerData)) {
                    workerData = toAbsoluteURL(workerData);
                }
                workerConn.setData(workerData, (err, params) => {
                    renderer.clear();
                    this.onWorkerReady(params);
                    renderer.setToRedraw();
                });
            }
        }
    }

    getExtent() {
        return this._dataExtent;
    }

    onWorkerReady(params) {
        if (params && params.extent) {
            this._setExtent(params.extent);
        }
        this.fire('dataload');
    }

    _setExtent(extent) {
        this._dataExtent = new maptalks.Extent(...extent);
    }

    _fetchData(data, cb) {
        if (isString(data)) {
            Ajax.getJSON(data, cb);
        } else {
            Ajax.getJSON(data.url, data, cb);
        }
    }

    getData() {
        return this.features || null;
    }

    getTileUrl(x, y, z) {
        return this.getId() + ',' + x + ',' + y + ',' + z;
    }

    getFeature(id) {
        return this._idMaps[id];
    }

    static fromJSON(layerJSON) {
        if (!layerJSON || layerJSON['type'] !== 'GeoJSONVectorTileLayer') {
            return null;
        }

        return new GeoJSONVectorTileLayer(layerJSON['id'], layerJSON['options']);
    }

    _generateIdMap() {
        if (!this.features) {
            return;
        }
        this.features = JSON.parse(JSON.stringify(this.features));
        if (!this.features) {
            return;
        }
        let uid = 0;
        this._idMaps = {};
        const data = this.features;
        if (Array.isArray(data)) {
            data.forEach(f => {
                if (f.id === undefined || f.id === null) {
                    f.id = uid++;
                }
                this._idMaps[f.id] = f;
            });
        } else if (data.features) {
            data.features.forEach(f => {
                if (f.id === undefined || f.id === null) {
                    f.id = uid++;
                }
                this._idMaps[f.id] = f;
            });
        }
    }
}

GeoJSONVectorTileLayer.registerJSONType('GeoJSONVectorTileLayer');

GeoJSONVectorTileLayer.mergeOptions(options);

export default GeoJSONVectorTileLayer;

function toAbsoluteURL(url) {
   let a = document.createElement('a');
    a.href = url;
    url = a.href;
    a = null;
    return url;
}
