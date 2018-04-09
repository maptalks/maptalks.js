import { compileStyle } from '../util/FeatureFilter';
import { extend } from '../../layer/core/Util';
import { buildExtrudeFaces } from '../builder/';
//TODO 改为从maptalks中载入compileStyle方法

export default class BaseLayerWorker {
    constructor(id, options) {
        this.id = id;
        this.options = options;
        this._compileStyle(options.style || {});
    }

    updateStyle(style, cb) {
        this._compileStyle(style);
        cb();
    }

    /**
     * Load a tile, paint and return gl directives
     * @param {Object} tileInfo  - tileInfo, xyz, res, extent, etc
     * @param {Function} cb - callback function when finished
     */
    loadTile(tileInfo, cb) {
        this.getTileFeatures(tileInfo, (err, features) => {
            if (err) {
                cb(err);
                return;
            }
            if (!features || features.length === 0) {
                cb();
                return;
            }
            const data = this.createTileData(features, this.options);
            cb(null, data.data, data.buffers);
        });
    }

    createTileData(features, options) {
        const data = {},
            buffers = [];

        const layerStyle = this.pluginConfig;
        for (const pluginType in layerStyle) {
            const pluginConfig = layerStyle[pluginType];
            const styles = pluginConfig.style;
            let all = true;
            //iterate plugin's styles and mark feature's style index
            for (let i = 0, l = styles.length; i < l; i++) {
                all = this._filterFeatures(styles[i].filter, features, pluginType, i);
                if (all) {
                    //all features are filtered
                    break;
                }
            }

            const filteredFeas = [];
            //only save feature's indexes, and restore features in renderer
            //[feature index, style index, feature index, style index, ....]
            const indexes = [];
            let feature;
            for (let i = 0, l = features.length; i < l; i++) {
                feature = features[i];
                if (feature.styleMark && feature.styleMark[pluginType] !== undefined) {
                    filteredFeas.push(feature);
                    indexes.push(i, feature.styleMark[pluginType]);
                }
            }

            if (filteredFeas.length === 0) {
                continue;
            }

            // const tileData = plugin.createTileDataInWorker(filteredFeas, this.options.extent);
            const tileData = this.createTileGeometry(filteredFeas, pluginConfig.dataConfig, this.options.extent);
            data[pluginType] = {
                data : tileData.data,
                featureIndex : new Uint16Array(indexes)
            };

            buffers.push(data[pluginType].featureIndex.buffer);
            if (tileData.buffers && tileData.buffers.length > 0) {
                for (let i = 0, l = tileData.buffers.length; i < l; i++) {
                    buffers.push(tileData.buffers[i]);
                }
            }
        }


        const styledFeas = [];
        if (options.features) {
            let feature;
            for (let i = 0, l = features.length; i < l; i++) {
                feature = features[i];
                if (feature.styleMark !== undefined) {
                    styledFeas.push({
                        type : feature.type,
                        layer : feature.layer,
                        properties : feature.properties
                    });
                    //reset feature's style mark
                    delete feature.styleMark;
                } else {
                    styledFeas.push(null);
                }
            }
        }

        return {
            data : {
                data : data,
                features : styledFeas
            },
            buffers : buffers
        };
    }

    createTileGeometry(features, dataConfig = {}, extent) {
        const type = dataConfig.type;
        if (type === '3d-extrusion') {
            const {
                altitudeScale,
                altitudeProperty,
                defaultAltitude,
                heightProperty,
                defaultHeight,
                normal, tangent
            } = dataConfig;

            const faces = buildExtrudeFaces(features, extent,
                altitudeScale, altitudeProperty, defaultAltitude || 0, heightProperty, defaultHeight || 0);
            if (normal) {
                //caculate normal
            }
            if (tangent) {
                //caculate tangent
            }
            return {
                data : faces,
                buffers : [faces.position.buffer, faces.indices.buffer, faces.indexes.buffer]
            };
        } else {
            return {
                data : {},
                buffers : null
            };
        }
    }

    /**
     * Filter
     * @param {*} filter
     * @param {*} features
     */
    _filterFeatures(filter, features, type, styleIdx) {
        //if all the features are filtered by the plugin
        let feature, count = 0;
        const l = features.length;
        for (let i = 0; i < l; i++) {
            feature = features[i];
            // a feature can only be painted once by one plugin
            if ((feature.styleMark === undefined || feature.styleMark[type] === undefined) && (!filter || filter(feature))) {
                if (!feature.styleMark) {
                    feature.styleMark = {};
                }
                feature.styleMark[type] = styleIdx;
            }
            if (feature.styleMark) {
                count++;
            }
        }
        return count === l;
    }

    _compileStyle(layerStyle) {
        this.pluginConfig = {};
        for (const p in layerStyle) {
            if (layerStyle.hasOwnProperty(p)) {
                this.pluginConfig[p] = extend({}, layerStyle[p], {
                    style : compileStyle(layerStyle[p].style)
                });
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
