import { extend, getIndexArrayType, compileStyle } from '../../common/Util';
import { buildWireframe, build3DExtrusion } from '../builder/';
import { PolygonPack, NativeLinePack, LinePack, PointPack, NativePointPack } from '@maptalks/vector-packer';
import Promise from '../../common/Promise';

const KEY_IDX = '__fea_idx';

export default class BaseLayerWorker {
    constructor(id, options, upload) {
        this.id = id;
        this.options = options;
        this.upload = upload;
        this._compileStyle(options.style || []);
    }

    updateStyle(style, cb) {
        this._compileStyle(style || []);
        cb();
    }

    /**
     * Load a tile, paint and return gl directives
     * @param {Object} tileInfo  - tileInfo, xyz, res, extent, etc
     * @param {Function} cb - callback function when finished
     */
    loadTile(context, cb) {
        this.getTileFeatures(context.tileInfo, (err, features) => {
            if (err) {
                cb(err);
                return;
            }
            if (!features || features.length === 0) {
                cb();
                return;
            }
            this._createTileData(features, context).then(data => {
                cb(null, data.data, data.buffers);
            });
        });
    }

    fetchIconGlyphs(icons, glyphs, cb) {
        //command, params, buffers and callback
        this.upload('fetchIconGlyphs', { icons, glyphs }, null, cb);
    }

    _createTileData(features, { glScale, zScale, tileInfo }) {
        if (!features.length) {
            return Promise.resolve({
                data : null,
                buffers : []
            });
        }
        const EXTENT = features[0].extent;
        const zoom = tileInfo.z,
            data = [],
            dataIndexes = [],
            options = this.options,
            buffers = [];
        const promises = [];
        for (let i = 0; i < this.pluginConfig.length; i++) {
            const pluginConfig = this.pluginConfig[i];
            const { tileFeatures, tileFeaIndexes } = this._filterFeatures(pluginConfig.filter, features, i);

            if (!tileFeatures.length) {
                continue;
            }
            const maxIndex = tileFeaIndexes[tileFeaIndexes.length - 1];
            const arrCtor = getIndexArrayType(maxIndex);
            data[i] = {
                //[feature_index, style_index, ...]
                styledFeatures : new arrCtor(tileFeaIndexes)
            };
            //index of plugin with data
            dataIndexes.push(i);
            buffers.push(data[i].styledFeatures.buffer);
            const promise = this._createTileGeometry(tileFeatures, pluginConfig, { extent : EXTENT, glScale, zScale, zoom });
            promises.push(promise);
        }

        return Promise.all(promises).then(tileDatas => {
            for (let i = 0; i < tileDatas.length; i++) {
                if (!tileDatas[i]) {
                    continue;
                }
                data[dataIndexes[i]].data = tileDatas[i].data;
                if (tileDatas[i].buffers && tileDatas[i].buffers.length) {
                    for (let ii = 0, ll = tileDatas[i].buffers.length; ii < ll; ii++) {
                        buffers.push(tileDatas[i].buffers[ii]);
                    }
                }
            }

            const allFeas = [];
            if (options.features) {
                let feature;
                for (let i = 0, l = features.length; i < l; i++) {
                    feature = features[i];
                    //reset feature's marks
                    if (feature && feature[KEY_IDX] !== undefined) {
                        delete feature[KEY_IDX];
                        delete feature._styleMark;
                        if (options.features === 'id') {
                            allFeas.push(feature.id);
                        } else {
                            const o = extend({}, feature);
                            if (!options.pickingGeometry) {
                                delete o.geometry;
                            }
                            delete o.extent;
                            allFeas.push(o);
                        }
                    } else {
                        //use '' instead of null, to reduce feature string size
                        allFeas.push('');
                    }
                }
            }

            return {
                data : {
                    data,
                    extent : EXTENT,
                    features : JSON.stringify(allFeas)
                },
                buffers
            };
        });

    }

    _createTileGeometry(features, pluginConfig, { extent, glScale, zScale, zoom }) {
        const tileSize = this.options.tileSize[0];
        const dataConfig = pluginConfig.renderPlugin.dataConfig;
        const symbol = pluginConfig.symbol;
        const type = dataConfig.type;
        if (type === '3d-extrusion') {
            return Promise.resolve(build3DExtrusion(features, dataConfig, extent, glScale, zScale, this.options['tileSize'][1]));
        } else if (type === '3d-wireframe') {
            return Promise.resolve(buildWireframe(features, dataConfig, extent));
        } else if (type === 'point') {
            const options = extend({}, dataConfig, {
                EXTENT : extent,
                requestor : this.fetchIconGlyphs.bind(this),
                zoom
            });
            const pack = new PointPack(features, symbol, options);
            return pack.load(extent / tileSize);
        } else if (type === 'native-point') {
            const options = extend({}, dataConfig, {
                EXTENT : extent,
                zoom
            });
            const pack = new NativePointPack(features, symbol, options);
            return pack.load(extent / tileSize);
        } else if (type === 'line') {
            const options = extend({}, dataConfig, {
                EXTENT : extent,
                requestor : this.fetchIconGlyphs.bind(this),
                zoom
            });
            const pack = new LinePack(features, symbol, options);
            return pack.load();
        } else if (type === 'native-line') {
            const options = extend({}, dataConfig, {
                EXTENT : extent,
                zoom
            });
            const pack = new NativeLinePack(features, symbol, options);
            return pack.load();
        } else if (type === 'fill') {
            const options = extend({}, dataConfig, {
                EXTENT : extent,
                requestor : this.fetchIconGlyphs.bind(this),
                zoom
            });
            const pack = new PolygonPack(features, symbol, options);
            return pack.load();
        }
        return {
            data : {},
            buffers : null
        };
    }

    /**
     * Filter
     * @param {*} filter
     * @param {*} features
     */
    _filterFeatures(filter, features) {
        const indexes = [];
        const filtered = [];
        const l = features.length;
        for (let i = 0; i < l; i++) {
            //filter.def没有定义，或者为default时，说明其实默认样式，feature之前没有其他样式时的应用样式
            if ((!filter.def || filter.def === 'default') && !features[i]._styleMark ||
                (filter.def === true || Array.isArray(filter.def) && filter(features[i]))) {
                features[i][KEY_IDX] = i;
                features[i]._styleMark = 1;
                filtered.push(features[i]);
                indexes.push(i);
            }
        }
        return {
            tileFeatures : filtered,
            tileFeaIndexes : indexes
        };
    }

    _compileStyle(layerStyle) {
        this.pluginConfig = compileStyle(layerStyle);
        for (let i = 0; i < layerStyle.length; i++) {
            if (this.pluginConfig[i].filter) {
                this.pluginConfig[i].filter.def = layerStyle[i].filter ? (layerStyle[i].filter.value || layerStyle[i].filter) : undefined;
            }
        }
    }
}

// LayerWorker.prototype.getProjViewMatrix = function (transform) {
//     const m = new Float64Array(16);
//     const m1 = new Float32Array(16);
//     return function (tileInfo, matrix) {
//         const tilePos = tileInfo.point;
//         const tileSize = this.tileSize;

//         const tileMatrix = mat4.identity(m);
//         mat4.translate(tileMatrix, tileMatrix, [tilePos.x, tilePos.y, 0]);
//         mat4.scale(tileMatrix, tileMatrix, [tileSize[0] / EXTENT, tileSize[1] / EXTENT, 1]);

//         //local transform in current frame
//         if (transform) {
//             mat4.multiply(tileMatrix, tileMatrix, transform);
//         }

//         mat4.multiply(tileMatrix, matrix, tileMatrix);

//         return mat4.copy(m1, tileMatrix);
//     };
// }();
