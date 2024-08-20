import { isString, isObject, extend, isNumber } from '../../common/Util';
import Ajax from '../util/Ajax';
import geojsonvt from '@maptalks/geojson-vt';
import BaseLayerWorker from './BaseLayerWorker';
import bbox from '@maptalks/geojson-bbox';
import { PackUtil } from '../../packer';
import computeOMBB from '../builder/Ombb.js';
import { PROP_OMBB } from '../../common/Constant';
// import { project } from '../builder/projection.js';

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
        this.setData(options.data, cb);
    }

    /**
     * Set data
     * @param {Object} data
     * @param {Function} cb  - callback function when finished
     */
    setData(data, cb) {
        delete this.index;
        if (isEmptyData(data)) {
            this.empty = true;
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
            if (options.projection === 'EPSG:4490') {
                options.projection = 'EPSG:4326';
            }
        }
        if (isString(data) && data.substring(0, 1) != '{' || data.url) {
            const url = data.url ? data.url : data;
            Ajax.getJSON(url, data.url ? data : {}, (err, resp) => {
                if (err) {
                    console.error('Failed to fetch geojson:' + url);
                    cb(err);
                }
                if (!resp) {
                    cb(null, { extent: null, idMap: {} });
                    return;
                }
                let data = resp;
                if (this.options.convertFn) {
                    const fn = new Function('data', this.options.convertFn + '\nreturn convert(data)');
                    data = fn(data);
                }
                const features = Array.isArray(data) ? data : data.features;
                this._genOMBB(features);
                // debugger
                const { sample1000, idMap } = this._generateId(features);
                this._generate(sample1000, idMap, data, options, cb);
            });
        } else {
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            const features = Array.isArray(data) ? data : data.features;
            const length = features && features.length;
            this._genOMBB(features);
            let sample1000 = features;
            if (features && length > 1000) {
                sample1000 = [];
                for (let i = 0; i < length; i++) {
                    insertSample(features[i], sample1000, i, length);
                }
            }
            this._generate(sample1000, null, data, options, cb);
        }
    }

    _genOMBB(features) {
        if (!this.options.generateOMBB) {
            return;
        }
        if (features) {
            // const projectionCode = this.options.projectionCode;
            // 大概的性能: 2023-06-24
            // 时间   feature数量    顶点数量
            // 84ms      2105        24621
            // debugger
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
                    // for (let j = 0; j < ombb.length; j++) {
                    //     if (Array.isArray(ombb[j])) {
                    //         project(ombb[j], ombb[j], projectionCode);
                    //     }
                    // }
                    f.properties = f.properties || {};
                    f.properties[PROP_OMBB] = ombb;
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
                        // for (let j = 0; j < ombb.length; j++) {
                        //     if (Array.isArray(ombb[j])) {
                        //         project(ombb[j], ombb[j], projectionCode);
                        //     }
                        // }
                        f.properties = f.properties || {};
                        f.properties[PROP_OMBB] = f.properties[PROP_OMBB] || [];
                        f.properties[PROP_OMBB][i] = ombb
                    }

                }
            }
        }
    }

    _generate(sample1000, idMap, data, options, cb) {
        try {
            const extent = sample1000 && sample1000.length ? bbox({ type: "FeatureCollection", features: sample1000 }) : null;
            this.index = geojsonvt(data, this.options.geojsonvt || options);
            cb(null, { extent, idMap });
        } catch (err) {
            console.warn(err);
            cb({ error: err.message });
        }
    }

    _generateId(data) {
        // generate id
        const sample1000 = [];
        const idMap = {};
        let uid = 0;
        const feaIdProp = this.options.featureIdProperty;
        function visit(f, index, length) {
            if (!f) {
                return;
            }
            if (f.type === 'Feature' && !f.geometry) {
                return;
            }
            if (!isNumber(f.id)) {
                f.id = uid++;
            }
            if (feaIdProp) {
                let idProp = feaIdProp;
                if (isObject(feaIdProp)) {
                    idProp = feaIdProp[f.layer || '0'];
                }
                f.id = f.properties[idProp];
            }
            idMap[f.id] = extend({}, f);
            if (f.geometry) {
                idMap[f.id].geometry = extend({}, f.geometry);
                idMap[f.id].geometry.coordinates = null;
            } else if (f.coordinates) {
                idMap[f.id].coordinates = null;
            }

            insertSample(f, sample1000, index, length);
        }
        if (data) {
            const length = data.length;
            data.forEach((f, index) => {
                visit(f, index, length);
            });
        }
        return { sample1000, idMap };
    }

    getTileFeatures(context, cb) {
        const tileInfo = context.tileInfo;
        const features = [];
        if (!this.index) {
            if (this.empty) {
                setTimeout(function () {
                    cb(null, features, []);
                }, 1);
                return 1;
            }
            setTimeout(function () {
                cb({ loading: true });
            }, 1);
            return 1;
        }
        const tile = this.index.getTile(tileInfo.z, tileInfo.x, tileInfo.y);
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

function insertSample(feature, sample1000, i, length) {
    const step = Math.floor(length / (1000 - 2));
    if (i === 0 || i === length - 1) {
        sample1000.push(feature);
    } else if ((step === 0 || i % step === 0) && sample1000.length < 999) {
        sample1000.push(feature);
    }
}

function isEmptyData(data) {
    if (!data) {
        return true;
    }
    if (Array.isArray(data) && !data.length) {
        return true;
    }
    if (data.features && !data.features.length) {
        return true;
    }
    return false;
}
