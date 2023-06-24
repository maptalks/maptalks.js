import { isString, extend, isNumber } from '../../common/Util';
import Ajax from '../util/Ajax';
import { log2 } from '../../common/Util';
import geojsonvt from '@maptalks/geojson-vt';
import BaseLayerWorker from './BaseLayerWorker';
import bbox from '@maptalks/geojson-bbox';
import { PackUtil } from '@maptalks/vector-packer';
import computeOMBB from '../builder/Ombb.js';
import { project } from '../builder/projection.js';

export default class GeoJSONLayerWorker extends BaseLayerWorker {
    /**
     *
     * @param {String} id - id
     * @param {Object} options - options
     * @param {Object} options.geojsonvt - options of geojsonvt
     * @param {Object} [options.headers=null]  - headers of http request for remote geojson
     * @param {Object} [options.jsonp=false]   - use jsonp to fetch remote geojson
     * @param {*} uploader
     * @param {*} cb
     */
    constructor(id, options, uploader, cache, loadings, cb) {
        super(id, options, uploader, cache, loadings);
        options = options || {};
        if (!options.extent) {
            options.extent = 8192;
        }
        this.zoomOffset = 0;
        if (options.tileSize) {
            //for different tile size, set a zoom offset for geojson-vt
            //https://github.com/mapbox/geojson-vt/issues/35
            this.zoomOffset = -log2(options.tileSize / 256);
        }
        this.setData(options.data, cb);
    }

    /**
     * Set data
     * @param {Object} data
     * @param {Function} cb  - callback function when finished
     */
    setData(data, cb) {
        delete this.index;
        if (!data) {
            cb();
            return;
        }
        const options = {
            maxZoom: 24,  // max zoom to preserve detail on; can't be higher than 24
            tolerance: this.options.simplifyTolerance, // simplification tolerance (higher means simpler)
            extent: this.options.extent, // tile extent (both width and height)
            buffer: isNumber(this.options.tileBuffer) ? this.options.tileBuffer : 64,      // tile buffer on each side
            hasAltitude: !!this.options.hasAltitude,
            debug: 0,      // logging level (0 to disable, 1 or 2)
            lineMetrics: true,
            indexMaxZoom: 5,       // max zoom in the initial tile index
            indexMaxPoints: 100000, // max number of points per tile in the index
            disableFilter: true
        };
        if (this.options.projection) {
            options.projection = this.options.projection;
        }
        if (isString(data) && data.substring(0, 1) != '{' || data.url) {
            Ajax.getJSON(data.url ? data.url : data, data.url ? data : {}, (err, resp) => {
                if (err) cb(err);
                if (!resp) {
                    cb(null, { extent: null, idMap: {} });
                    return;
                }
                const data = resp;
                const features = Array.isArray(data) ? data : data.features;
                this._genOMBB(features);
                // debugger
                const { first1000, idMap } = this._generateId(features);
                this._generate(first1000, idMap, data, options, cb);
            });
        } else {
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            const features = Array.isArray(data) ? data : data.features;
            this._genOMBB(features);
            let first1000 = features;
            if (features && features.length > 1000) {
                first1000 = features.slice(0, 1000);
            }
            this._generate(first1000, null, data, options, cb);
        }
    }

    _genOMBB(features) {
        if (this.options.topOmbbUV && features) {
            const projectionCode = this.options.projectionCode;
            const start = performance.now();
            let count = 0;
            for (let i = 0; i < features.length; i++) {
                const f = features[i];
                if (!f || !f.geometry || !f.geometry.coordinates) {
                    continue;
                }
                if (f.geometry.type === 'Polygon') {
                    const shell = f.geometry.coordinates[0];
                    if (!shell) {
                        continue;
                    }
                    const ombb = computeOMBB(shell, 0, shell.length);
                    count += shell.length;
                    for (let j = 0; j < ombb.length; j++) {
                        if (Array.isArray(ombb[j])) {
                            project(ombb[j], ombb[j], projectionCode);
                        }
                    }
                    f.properties = f.properties || {};
                    f.properties.ombb = ombb;
                } else if (f.geometry.type === 'MultiPolygon') {
                    const polygons = f.geometry.coordinates;
                    for (let i = 0; i < polygons.length; i++) {
                        if (!polygons[i]) {
                            continue;
                        }
                        const shell = polygons[i][0];
                        if (!shell) {
                            continue;
                        }
                        const ombb = computeOMBB(shell, 0, shell.length);
                        count += shell.length;
                        for (let j = 0; j < ombb.length; j++) {
                            if (Array.isArray(ombb[j])) {
                                project(ombb[j], ombb[j], projectionCode);
                            }
                        }
                        f.properties = f.properties || {};
                        f.properties.ombb = f.properties.ombb || [];
                        f.properties.ombb[i] = ombb
                    }

                }
            }
            console.log(performance.now() - start, features.length, count);
        }
    }

    _generate(first1000, idMap, data, options, cb) {
        try {
            const extent = first1000 && first1000.length ? bbox({ type: "FeatureCollection", features: first1000 }) : null;
            this.index = geojsonvt(data, this.options.geojsonvt || options);
            cb(null, { extent, idMap });
        } catch (err) {
            console.warn(err);
            cb({ error: err.message });
        }
    }

    _generateId(data) {
        // generate id
        const first1000 = [];
        const idMap = {};
        let uid = 0;
        function visit(f) {
            if (!f) {
                return;
            }
            if (f.type === 'Feature' && !f.geometry) {
                return;
            }
            if (!isNumber(f.id)) {
                f.id = uid++;
            }
            idMap[f.id] = extend({}, f);
            if (f.geometry) {
                idMap[f.id].geometry = extend({}, f.geometry);
                idMap[f.id].geometry.coordinates = null;
            } else if (f.coordinates) {
                idMap[f.id].coordinates = null;
            }

            if (first1000.length < 1000) {
                first1000.push(f);
            }
        }
        if (data) {
            data.forEach(f => {
                visit(f);
            });
        }
        return { first1000, idMap };
    }

    getTileFeatures(context, cb) {
        const tileInfo = context.tileInfo;
        const features = [];
        if (!this.index) {
            setTimeout(function () {
                cb({ loading: true });
            }, 1);
            return 1;
        }
        const tile = this.index.getTile(tileInfo.z + this.zoomOffset, tileInfo.x, tileInfo.y);
        if (!tile || tile.features.length === 0) {
            setTimeout(function () {
                cb(null, features, []);
            }, 1);
            return 1;
        }
        const layers = [];
        for (let i = 0, l = tile.features.length; i < l; i++) {
            const feature = tile.features[i];

            let layerId = feature.layer;
            if (layerId === undefined) {
                layerId = '0';
            }
            layers[layerId] = {
                types: {}
            };
            const types = layers[layerId].types;
            types[feature.type] = 1;
            feature.tags = feature.tags || {};
            // feature.tags['$layer'] = layerId;
            // feature.tags['$type'] = feature.type;
            if (!feature.geometry.converted) {
                PackUtil.convertGeometry(feature);
                feature.geometry.converted = 1;
            }
            features.push({
                type: feature.type,
                layer: layerId,
                id: feature.id,
                geometry: feature.geometry,
                properties: feature.tags,
                extent: this.options.extent
            });
        }

        for (const p in layers) {
            layers[p].types = Object.keys(layers[p].types).map(t => +t);
        }

        //TODO 增加geojson-vt的多图层支持
        setTimeout(function () {
            cb(null, features, layers);
        }, 1);

        return 1;
    }

    onRemove() {
        super.onRemove();
        delete this.index;
    }
}
