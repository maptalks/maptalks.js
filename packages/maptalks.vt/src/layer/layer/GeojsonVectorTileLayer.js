// import * as maptalks from 'maptalks';
import VectorTileLayer from './VectorTileLayer';
import VectorTileLayerRenderer from '../renderer/VectorTileLayerRenderer';


class GeoJSONVectorTileLayer extends VectorTileLayer {

    constructor(id, options) {
        super(id, options);
    }

    getWorkerOptions() {
        return {
            data : this.options.data,
            style : this.options.style
        };
    }

    getData() {
        return this.options.data;
    }

    setData(data) {
        this.options.data = data;
        return this;
    }

    getTileUrl(/*z: number, x: number, y: number*/) {
        return '';
    }
}

GeoJSONVectorTileLayer.registerJSONType('GeoJSONVectorTileLayer');

GeoJSONVectorTileLayer.registerRenderer('gl', VectorTileLayerRenderer);
GeoJSONVectorTileLayer.registerRenderer('canvas', null);

export default GeoJSONVectorTileLayer;
