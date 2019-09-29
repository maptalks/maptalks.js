import VectorTileLayer from './VectorTileLayer';
import Ajax from '../../worker/util/Ajax';
import { isString } from '../../common/Util';

const options = {
    //feature data to return from worker
    //for geojson layer, only need to return id of features
    features : 'id',
    tileBuffer : 64,
    extent : 8192
};

class GeoJSONVectorTileLayer extends VectorTileLayer {

    constructor(id, options = {}) {
        super(id, options);
        this.setData(options['data']);
    }

    getWorkerOptions() {
        const options = super.getWorkerOptions();
        options.data = JSON.stringify(this.features);
        options.tileBuffer = this.options.tileBuffer;
        options.extent = this.options.extent;
        return options;
    }

    setData(data) {
        if (isString(data)) {
            Ajax.getJSON(data, (err, data) => {
                if (err) {
                    throw err;
                }
                this.setData(data);
            });
            return this;
        }
        this.options.data = data;
        this.features = data;
        this._generateIdMap();
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.clear();
            const workerConn = renderer.getWorkerConnection();
            if (workerConn) {
                workerConn.setData(this.features, () => {
                    renderer.setToRedraw();
                });
            }
        }
        return this;
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
