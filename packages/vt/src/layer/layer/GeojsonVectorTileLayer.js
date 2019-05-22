import * as maptalks from 'maptalks';
import VectorTileLayer from './VectorTileLayer';
import VectorTileLayerRenderer from '../renderer/VectorTileLayerRenderer';
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
        options.data = this._data;
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
        this._data = data;
        this._generateIdMap();
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.clear();
            const workerConn = renderer.getWorkerConnection();
            if (workerConn) {
                workerConn.setData(data, () => {
                    renderer.setToRedraw();
                });
            }
        }
        return this;
    }

    getData() {
        return this._data || null;
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
        if (!this._data) {
            return;
        }
        this.features = JSON.parse(JSON.stringify(this._data));
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
        this._data = JSON.stringify(this.features);
    }
}

GeoJSONVectorTileLayer.registerJSONType('GeoJSONVectorTileLayer');

GeoJSONVectorTileLayer.registerRenderer('gl', VectorTileLayerRenderer);
GeoJSONVectorTileLayer.registerRenderer('canvas', null);

GeoJSONVectorTileLayer.mergeOptions(options);

export default GeoJSONVectorTileLayer;
