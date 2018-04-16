import { compileStyle } from '../util/FeatureFilter';
import { extend } from '../../layer/core/Util';
import { buildExtrudeFaces } from '../builder/';
import { buildUniqueVertex, buildFaceNormals } from '../builder/Build';
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
            const data = this.createTileData(features, context);
            cb(null, data.data, data.buffers);
        });
    }

    createTileData(features, { glScale, zScale }) {
        const data = {},
            options = this.options,
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
            const tileData = this.createTileGeometry(filteredFeas, pluginConfig.dataConfig, { extent : options.extent, glScale, zScale });
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

    createTileGeometry(features, dataConfig = {}, { extent, glScale, zScale }) {
        const type = dataConfig.type;
        if (type === '3d-extrusion') {
            const {
                altitudeScale,
                altitudeProperty,
                defaultAltitude,
                heightProperty,
                defaultHeight,
                normal, tangent,
                uv, uvSize
            } = dataConfig;

            const faces = buildExtrudeFaces(
                features, extent,
                {
                    altitudeScale, altitudeProperty,
                    defaultAltitude : defaultAltitude || 0,
                    heightProperty,
                    defaultHeight : defaultHeight || 0
                },
                {
                    uv,
                    uvSize : uvSize || [128, 128],
                    //>> needed by uv computation
                    glScale,
                    //用于白模侧面的uv坐标v的计算
                    // zScale用于将meter转为gl point值
                    // (extent / this.options['tileSize'][1])用于将gl point转为瓦片内坐标
                    vScale : zScale * (extent / this.options['tileSize'][1])
                    //<<
                });

            const buffers = [faces.vertices.buffer, faces.indices.buffer, faces.indexes.buffer];

            const uniFaces = buildUniqueVertex({ vertices : faces.vertices }, faces.indices, { 'vertices' : { size : 3 }});
            faces.vertices = uniFaces.vertices;
            // debugger
            if (normal) {
                const normals = buildFaceNormals(faces.vertices, faces.indices);
                faces.normals = normals;
                buffers.push(normals.buffer);
            }
            if (tangent) {
                //TODO caculate tangent
            }
            if (uv) {
                buffers.push(faces.uvs.buffer);
            }
            return {
                data : faces,
                buffers
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
