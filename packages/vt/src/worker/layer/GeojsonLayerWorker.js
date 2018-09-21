import Ajax from '../util/Ajax';
import { log2 } from '../../common/Util';
import geojsonvt from 'geojson-vt';
import BaseLayerWorker from './BaseLayerWorker';
// import EXTENT from '../../data/extent';

export default class GeoJSONLayerWorker extends BaseLayerWorker {
    constructor(id, options, uploader, cb) {
        super(id, options, uploader);
        options = options || {};
        if (!options.extent) {
            options.extent = 8192;
        }
        this.zoomOffset = 0;
        if (options.tileSize) {
            //for different tile size, set a zoom offset for geojson-vt
            //https://github.com/mapbox/geojson-vt/issues/35
            this.zoomOffset = -log2(options.tileSize[0] / 256);
        }
        this.setData(JSON.parse(options.data), options, cb);
    }

    /**
     * Set data
     * @param {Object} data
     * @param {Object} options - options
     * @param {Object} options.geojsonvt - options of geojsonvt
     * @param {Object} [options.headers=null]  - headers of http request for remote geojson
     * @param {Object} [options.jsonp=false]   - use jsonp to fetch remote geojson
     * @param {Function} cb  - callback function when finished
     */
    setData(data, options, cb) {
        delete this.index;
        if (!data) {
            cb();
            return;
        }
        const prefix = typeof data === 'string' ? data.substring(0, 4) : null;
        if (prefix === 'http' || prefix === 'blob') {
            Ajax.getJSON(data, options, (err, resp) => {
                if (err) cb(err);
                this.index = geojsonvt(resp, options.geojsonvt);
                cb();
            });
        } else {
            this.index = geojsonvt(data, options.geojsonvt || {
                maxZoom: 24,  // max zoom to preserve detail on; can't be higher than 24
                tolerance: 3, // simplification tolerance (higher means simpler)
                extent: this.options.extent, // tile extent (both width and height)
                buffer: this.options.tileBuffer || 64,	  // tile buffer on each side
                debug: 0,      // logging level (0 to disable, 1 or 2)

                indexMaxZoom: 5,       // max zoom in the initial tile index
                indexMaxPoints: 100000 // max number of points per tile in the index
            });
        }
        cb();
    }

    getTileFeatures(tileInfo, cb) {
        const features = [];
        if (!this.index) {
            cb(null, features);
            return;
        }
        const tile = this.index.getTile(tileInfo.z + this.zoomOffset, tileInfo.x, tileInfo.y);
        if (!tile || tile.features.length === 0) {
            cb(null, features);
            return;
        }
        // debugger
        let feature;
        for (let i = 0, l = tile.features.length; i < l; i++) {
            feature = tile.features[i];
            features.push({
                type : feature.type,
                layer : this.id,
                id : feature.id,
                geometry : feature.geometry,
                properties : feature.tags,
                extent : this.options.extent
            });
        }
        cb(null, features);
    }

    onRemove() {
        delete this.index;
    }
}
