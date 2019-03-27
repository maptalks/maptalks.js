import easing from 'animation-easings';
import { createFilter } from '@maptalks/feature-filter';
import VectorTilePlugin from './VectorTilePlugin';
import Color from 'color';

const DEFAULT_ANIMATION_DURATION = 800;

/**
 * Create a VT Plugin with a given painter
 */
function createPainterPlugin(type, Painter) {
    var PainterPlugin = VectorTilePlugin.extend(type, {

        init: function () {
            this._meshCache = {};
        },

        startFrame: function (context) {
            var layer = context.layer,
                regl = context.regl,
                sceneConfig = context.sceneConfig;
            var painter = this.painter;
            if (!painter) {
                var pluginIndex = context.pluginIndex;
                painter = this.painter = new Painter(regl, layer, sceneConfig, pluginIndex);
            }
            if (!this._meshCache) {
                this._meshCache = {};
            }
            var excludes = sceneConfig.excludes;
            if (excludes !== this._excludes) {
                this._excludesFunc = excludes ? createFilter(excludes) : null;
                this._excludes = excludes;
            }
            //先清除所有的tile mesh, 在后续的paintTile中重新加入，每次只绘制必要的tile
            painter.startFrame(context);
            this._frameCache = {};
        },

        endFrame: function (context) {
            var painter = this.painter;
            if (painter) {
                return painter.render(context);
            }
            return null;
        },

        paintTile: function (context) {
            var tileCache = context.tileCache,
                tileData = context.tileData,
                tileInfo = context.tileInfo,
                tileTransform = tileData.transform,
                tileZoom = context.tileZoom,
                sceneConfig = context.sceneConfig;
            var painter = this.painter;
            if (!painter) {
                return {
                    redraw: false
                };
            }
            var key = tileInfo.dupKey;
            let geometry = tileCache.geometry;
            var features = tileData.features;
            if (!geometry) {
                var glData = tileData.data;
                var data = glData;
                if (this.painter.colorSymbol) {
                    var colors = this._generateColorArray(features, glData.featureIndexes, glData.indices, glData.vertices);
                    data = extend({}, glData);
                    if (colors) {
                        data.colors = colors;
                    }
                }
                geometry = tileCache.geometry = painter.createGeometry(data, features);
                geometry.properties.features = features;
                this._fillCommonProps(geometry, context);
            }
            if (!geometry) {
                return {
                    'redraw': false
                };
            }
            if (tileCache.excludes !== this._excludes) {
                this._filterElements(geometry, tileData.data, features, context.regl);
                tileCache.excludes = this._excludes;
            }
            var mesh = this._getMesh(key);
            if (!mesh) {
                mesh = painter.createMesh(geometry, tileTransform);
                if (mesh) {
                    if (Array.isArray(mesh)) {
                        for (let i = 0; i < mesh.length; i++) {
                            mesh[i].properties.tileTransform = tileTransform;
                            mesh[i].properties.createTime = context.timestamp;
                            mesh[i].properties.meshKey = key + '-' + i;
                        }
                    } else {
                        mesh.properties.tileTransform = tileTransform;
                        mesh.properties.createTime = context.timestamp;
                        mesh.properties.meshKey = key;
                    }
                    if (sceneConfig.animation) {
                        this._animationTime = context.timestamp;
                    }
                }
                this._meshCache[key] = mesh;
            }
            if (!mesh || Array.isArray(mesh) && !mesh.length) {
                return {
                    'redraw': false
                };
            }
            //zoom :  z - 2 | z - 1 | z | z + 1 | z + 2
            //level:    4       2     0     1       3
            const level = tileInfo.z - tileZoom > 0 ? 2 * (tileInfo.z - tileZoom) - 1 : 2 * (tileZoom - tileInfo.z);
            if (Array.isArray(mesh)) {
                mesh.forEach(m => {
                    m.properties.tile = tileInfo;
                    m.properties.level = level;
                    m.setUniform('level', level);
                });
            } else {
                mesh.properties.tile = tileInfo;
                mesh.properties.level = level;
                mesh.setUniform('level', level);
            }
            let redraw = false;
            if (!this._frameCache[key]) {
                let progress = null;
                let animation = sceneConfig.animation;
                if (animation) {
                    const duration = context.sceneConfig.animationDuration || DEFAULT_ANIMATION_DURATION;
                    const t = (context.timestamp - this._animationTime) / duration;
                    const createTime = Array.isArray(mesh) ? mesh[0].properties.createTime : mesh.properties.createTime;
                    if (this._animationTime - createTime < duration && t < 1) {
                        if (animation === true || animation === 1) {
                            animation = 'linear';
                        }
                        progress = animation === 'linear' ? t : easing(animation, t);
                        redraw = true;
                    }
                }
                painter.addMesh(mesh, progress);
                this._frameCache[key] = 1;
            }

            return {
                redraw
            };
        },

        _fillCommonProps(geometry, context) {
            const { layer, tileInfo } = context;
            const map = layer.getMap(),
                tileResolution = map.getResolution(tileInfo.z),
                tileRatio = context.tileExtent / layer.getTileSize().width;
            geometry.properties.tileResolution = tileResolution;
            geometry.properties.tileRatio = tileRatio;
            geometry.properties.z = tileInfo.z;
            geometry.properties.tileExtent = context.tileExtent;

        },

        updateSceneConfig: function (context) {
            var painter = this.painter;
            if (painter) {
                painter.updateSceneConfig(context.sceneConfig);
            }
        },

        updateSymbol: function () {
            var painter = this.painter;
            if (painter && this._meshCache) {
                for (var key in this._meshCache) {
                    painter.deleteMesh(this._meshCache[key], true);
                }
            }
            delete this._meshCache;
        },

        pick: function (x, y) {
            if (this.painter && this.painter.pick) {
                return this.painter.pick(x, y);
            }
            return null;
        },

        deleteTile: function (context) {
            if (!this._meshCache) {
                return;
            }
            var tileInfo = context.tileInfo;
            var key = tileInfo.dupKey;
            var mesh = this._meshCache[key];
            if (mesh && this.painter) {
                this.painter.deleteMesh(mesh);
            }
            delete this._meshCache[key];
            delete this._frameCache[key];
        },

        remove: function () {
            var painter = this.painter;
            if (painter && this._meshCache) {
                for (var key in this._meshCache) {
                    painter.deleteMesh(this._meshCache[key]);
                }
                painter.delete();
                delete this.painter;
            }
            delete this._meshCache;
            delete this._frameCache;
        },

        resize: function (size) {
            var painter = this.painter;
            if (painter) {
                painter.resize(size);
            }
        },

        needToRedraw: function () {
            if (!this.painter) {
                return false;
            }
            return this.painter.needToRedraw();
        },

        _generateColorArray: function (features, featureIndexes, indices, vertices) {
            if (!vertices) {
                return null;
            }
            var colors = new Uint8Array(vertices.length);
            var symbol, rgb;
            var visitedColors = {};
            var pos;
            for (var i = 0, l = featureIndexes.length; i < l; i++) {
                var idx = featureIndexes[i];
                symbol = features[idx].symbol;
                rgb = visitedColors[idx];
                if (!rgb) {
                    var color = Color(symbol[this.painter.colorSymbol]);
                    rgb = visitedColors[idx] = color.array();
                }
                pos = indices[i] * 3;
                colors[pos] = rgb[0];
                colors[pos + 1] = rgb[1];
                colors[pos + 2] = rgb[2];

            }
            return colors;
        },

        _getMesh: function (key) {
            return this._meshCache[key];
        },

        _filterElements(geometry, glData, features, regl) {
            if (Array.isArray(geometry)) {
                geometry.forEach((g, idx) => {
                    this._filterGeoElements(g, glData.packs[idx], features, regl);
                });
            } else {
                this._filterGeoElements(geometry, glData, features, regl);
            }
        },

        _filterGeoElements(geometry, glData, features, regl) {
            var featureIndexes = glData.featureIndexes || glData.data.featureIndexes;
            if (!featureIndexes) return;
            if (this._excludesFunc) {
                var indices = glData.indices;
                var pre = null,
                    excluded = false;
                var elements = [];
                for (var i = 0; i < indices.length; i++) {
                    var feature = features[featureIndexes[indices[i]]];
                    if (pre === null || pre !== indices[i]) {
                        excluded = this._excludesFunc(feature.feature);
                        pre = indices[i];
                    }
                    if (!excluded) {
                        elements.push(indices[i]);
                    }
                }
                geometry.setElements(new glData.indices.constructor(elements));
            } else {
                geometry.setElements(glData.indices);
            }
            geometry.generateBuffers(regl);
        }
    });

    return PainterPlugin;
}

export default createPainterPlugin;

export function extend(dest) {
    for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i];
        for (var k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}
