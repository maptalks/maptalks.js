// import * as maptalks from 'maptalks';
import VectorTileLayer from './VectorTileLayer';
import VectorTileLayerRenderer from '../renderer/VectorTileLayerRenderer';

const options = {
    features : 'id'
};

class GeoJSONVectorTileLayer extends VectorTileLayer {

    constructor(id, options) {
        super(id, options);
        this._generateIdMap();
    }

    getWorkerOptions() {
        const options = super.getWorkerOptions();
        options.data = this.options.data;
        return options;
    }

    getData() {
        return this.options.data;
    }

    setData(data) {
        this.options.data = data;
        this._generateIdMap();
        return this;
    }

    getTileUrl(/*z: number, x: number, y: number*/) {
        return '';
    }

    getFeature(id) {
        return this._idMaps[id];
    }

    _generateIdMap() {
        this.features = this.options.data;
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
        this.options.data = JSON.stringify(this.features);
    }
}

GeoJSONVectorTileLayer.registerJSONType('GeoJSONVectorTileLayer');

GeoJSONVectorTileLayer.registerRenderer('gl', VectorTileLayerRenderer);
GeoJSONVectorTileLayer.registerRenderer('canvas', null);

VectorTileLayer.mergeOptions(options);

export default GeoJSONVectorTileLayer;
