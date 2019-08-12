import easing from 'animation-easings';
import { createFilter } from '@maptalks/feature-filter';
import VectorTilePlugin from './VectorTilePlugin';
import Color from 'color';

var DEFAULT_ANIMATION_DURATION = 800;

var NO_REDRAW = {
    redraw: false
};

var THROTTLE_KEY = '__vt_plugin_mesh_throttle';

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
            if (layer.options['meshCreationLimitOnInteracting'] && layer.getMap()[THROTTLE_KEY]) {
                layer.getMap()[THROTTLE_KEY].length = 0;
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
            var layer = context.layer,
                tileCache = context.tileCache,
                tileData = context.tileData,
                tileInfo = context.tileInfo,
                tileCenter = tileInfo.point,
                tileTransform = context.tileTransform,
                tileZoom = context.tileZoom,
                sceneConfig = context.sceneConfig;
            var painter = this.painter;
            if (!painter) {
                return {
                    redraw: false
                };
            }
            var key = this._getMeshKey(context);
            let geometry = tileCache.geometry;
            if (!geometry) {
                if (this._throttle(layer, key)) {
                    return NO_REDRAW;
                }
                var features = tileData.features;
                var glData = tileData.data;
                var data = glData;
                if (this.painter.colorSymbol && glData) {
                    var colors = this._generateColorArray(features, glData.data.aPickingId, glData.indices, glData.data.aPosition);
                    data.data.aColor = colors;
                }
                geometry = tileCache.geometry = painter.createGeometry(data, features);
                if (geometry) {
                    if (Array.isArray(geometry)) {
                        for (let i = 0; i < geometry.length; i++) {
                            geometry[i].properties.features = features;
                            this._fillCommonProps(geometry[i], context);
                        }
                    } else {
                        geometry.properties.features = features;
                        this._fillCommonProps(geometry, context);
                    }
                    if (tileCache.excludes !== this._excludes) {
                        this._filterElements(geometry, tileData.data, context.regl);
                        tileCache.excludes = this._excludes;
                    }
                }
            }
            if (!geometry) {
                return NO_REDRAW;
            }

            var mesh = this._getMesh(key);
            if (!mesh) {
                if (this._throttle(layer, key)) {
                    return NO_REDRAW;
                }
                mesh = painter.createMesh(geometry, tileTransform, { tileCenter, tileZoom });
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
                        mesh._animationTime = context.timestamp;
                    }
                }
                this._meshCache[key] = mesh;
            }
            if (!mesh || Array.isArray(mesh) && !mesh.length) {
                return NO_REDRAW;
            }
            var enableTileStencil = layer.getRenderer().isEnableTileStencil();
            //zoom :  z - 2 | z - 1 | z | z + 1 | z + 2
            //level:    4       2     0     1       3
            var level = tileInfo.z - tileZoom > 0 ? 2 * (tileInfo.z - tileZoom) - 1 : 2 * (tileZoom - tileInfo.z);
            if (Array.isArray(mesh)) {
                mesh.forEach(m => {
                    m.properties.tile = tileInfo;
                    m.properties.level = level;
                    m.setUniform('level', level);
                    if (enableTileStencil) {
                        m.defines['ENABLE_TILE_STENCIL'] = 1;
                        m.setDefines(m.defines);
                        if (!m.material.uniforms.hasOwnProperty('stencilRef')) {
                            Object.defineProperty(m.material.uniforms, 'stencilRef', {
                                enumerable: true,
                                get: function () {
                                    return m.properties.tile ? m.properties.tile.stencilRef : 255;
                                }
                            });
                        }
                    }
                });
            } else {
                mesh.properties.tile = tileInfo;
                mesh.properties.level = level;
                mesh.setUniform('level', level);
                if (enableTileStencil) {
                    mesh.defines['ENABLE_TILE_STENCIL'] = 1;
                    mesh.setDefines(mesh.defines);
                    if (!mesh.material.uniforms.hasOwnProperty('stencilRef')) {
                        Object.defineProperty(mesh.material.uniforms, 'stencilRef', {
                            enumerable: true,
                            get: function () {
                                return mesh.properties.tile ? mesh.properties.tile.stencilRef : 255;
                            }
                        });
                    }
                }
            }
            var redraw = false;
            if (!this._frameCache[key]) {
                var progress = null;
                var animation = sceneConfig.animation;
                if (animation) {
                    var duration = context.sceneConfig.animationDuration || DEFAULT_ANIMATION_DURATION;
                    var t = (context.timestamp - mesh._animationTime) / duration;
                    var createTime = Array.isArray(mesh) ? mesh[0].properties.createTime : mesh.properties.createTime;
                    if (mesh._animationTime - createTime < duration && t < 1) {
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

        _fillCommonProps: function (geometry, context) {
            var { layer, tileInfo } = context;
            var map = layer.getMap(),
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
            if (!painter) {
                return;
            }
            if (painter.shouldDeleteMeshOnUpdateSymbol()) {
                if (this._meshCache) {
                    for (var key in this._meshCache) {
                        painter.deleteMesh(this._meshCache[key], true);
                    }
                }
                delete this._meshCache;
            }
            painter.updateSymbol();
        },

        pick: function (x, y, tolerance) {
            if (this.painter && this.painter.pick) {
                return this.painter.pick(x, y, tolerance);
            }
            return null;
        },

        deleteTile: function (context) {
            if (!this._meshCache) {
                return;
            }
            var key = this._getMeshKey(context);
            var mesh = this._meshCache[key];
            if (mesh && this.painter) {
                this.painter.deleteMesh(mesh);
            }
            delete this._meshCache[key];
            if (this._frameCache) {
                delete this._frameCache[key];
            }
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

        canStencil: function () {
            if (!this.painter) {
                return false;
            }
            return this.painter.canStencil();
        },

        _generateColorArray: function (features, featureIndexes, indices, vertices) {
            if (!vertices || !features || !features.length) {
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

        _getMeshKey: function (context) {
            var tileInfo = context.tileInfo;
            var layer = context.layer;
            var pluginIndex = context.pluginIndex;
            return layer.getId() + '-' + pluginIndex + '-' + tileInfo.id;
        },

        _getMesh: function (key) {
            return this._meshCache[key];
        },

        _filterElements(geometry, glData, regl) {
            if (Array.isArray(geometry)) {
                geometry.forEach((g, idx) => {
                    const { features } = g.properties;
                    this._filterGeoElements(g, glData[idx], features, regl);
                });
            } else {
                const { features } = geometry.properties;
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
        },

        _throttle(layer, key) {
            var limit = layer.options['tileMeshCreationLimitPerFrame'] || 0;
            if (!limit) {
                return false;
            }
            var map = layer.getMap();
            if (!map.isInteracting()) {
                return false;
            }
            var keys = map[THROTTLE_KEY];
            if (!keys) {
                keys = map[THROTTLE_KEY] = [];
            }
            if (keys.indexOf(key) >= 0) {
                return false;
            }
            keys.push(key);
            return keys.length > limit;
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
