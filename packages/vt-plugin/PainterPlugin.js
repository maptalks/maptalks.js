import easing from 'animation-easings';
import { createFilter } from '@maptalks/feature-filter';
import VectorTilePlugin from './VectorTilePlugin';
import Color from 'color';

var DEFAULT_ANIMATION_DURATION = 800;

var NO_REDRAW = {
    redraw: false
};

var EMPTY_ARRAY = [];

var THROTTLE_KEY = '__vt_plugin_mesh_throttle';
/**
 * Create a VT Plugin with a given painter
 */
function createPainterPlugin(type, Painter) {
    var PainterPlugin = VectorTilePlugin.extend(type, {

        init: function () {
            this._meshCache = {};
        },

        supportRenderMode: function (mode) {
            return this.painter.supportRenderMode(mode);
        },

        startFrame: function (context) {
            var layer = context.layer,
                regl = context.regl,
                sceneConfig = context.sceneConfig,
                dataConfig = context.dataConfig,
                symbol = context.symbol;
            var painter = this.painter;
            if (!painter) {
                var pluginIndex = context.pluginIndex;
                painter = this.painter = new Painter(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig);
            }
            if (!this._meshCache) {
                this._meshCache = {};
            }
            var excludes = sceneConfig.excludes;
            if (!this._excludes) {
                if (excludes) {
                    this._excludes = excludes;
                }
            } else if (excludes !== this._excludes) {
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

        updateCollision: function (context) {
            var painter = this.painter;
            if (painter && painter.isVisible()) {
                return painter.updateCollision(context);
            }
            return null;
        },

        endFrame: function (context) {
            var painter = this.painter;
            if (painter && painter.isVisible()) {
                return painter.render(context);
            }
            return null;
        },

        getShadowMeshes() {
            var painter = this.painter;
            if (!painter || !painter.getShadowMeshes) {
                return EMPTY_ARRAY;
            }
            return painter.getShadowMeshes() || EMPTY_ARRAY;
        },

        paintTile: function (context) {
            var {
                layer,
                tileCache,
                tileData,
                tileInfo,
                tileExtent,
                tileTransform,
                tileTranslationMatrix,
                tileZoom,
                sceneConfig,
                bloom
            } = context;
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
                if (!glData) {
                    return NO_REDRAW;
                }
                var data = glData;
                if (this.painter.colorSymbol && glData) {
                    var colors = this._generateColorArray(features, glData.data.aPickingId, glData.indices, glData.data.aPosition, glData.positionSize);
                    data.data.aColor = colors;
                }
                geometry = tileCache.geometry = painter.prepareGeometry(data, features);
                if (geometry) {
                    if (Array.isArray(geometry)) {
                        for (let i = 0; i < geometry.length; i++) {
                            geometry[i].properties.features = features;
                            this._fillCommonProps(geometry[i], context);
                        }
                    } else if (geometry.properties) {
                        geometry.properties.features = features;
                        this._fillCommonProps(geometry, context);
                    }
                    if (tileCache.excludes !== this._excludes) {
                        this._filterElements(geometry, tileData.data);
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
                mesh = painter.createMesh(geometry, tileTransform, { tileExtent, tilePoint: tileInfo.point.toArray(), tileZoom, tileTranslationMatrix });
                if (mesh) {
                    var enableTileStencil = layer.getRenderer().isEnableTileStencil();
                    if (Array.isArray(mesh)) {
                        for (let i = 0; i < mesh.length; i++) {
                            this._fillMeshProps(mesh[i], tileTransform, context, key + '-' + i, enableTileStencil);
                        }
                    } else {
                        this._fillMeshProps(mesh, tileTransform, context, key, enableTileStencil);
                    }
                    if (sceneConfig.animation) {
                        mesh._animationTime = context.timestamp;
                    }
                    this._meshCache[key] = mesh;
                }
            }
            if (!mesh || Array.isArray(mesh) && !mesh.length) {
                return NO_REDRAW;
            }

            //更新stencil level值，不同zoom会发生变化
            var level = getUniformLevel(tileInfo.z, tileZoom);
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
                const bloomValue = +(bloom && painter.getSymbol()['bloom']);
                if (Array.isArray(mesh)) {
                    mesh.forEach(m => m.setUniform('bloom', bloomValue));
                } else {
                    mesh.setUniform('bloom', bloomValue);
                }

                painter.addMesh(mesh, progress);
                this._frameCache[key] = 1;
            }

            return {
                redraw
            };
        },

        _fillMeshProps: function (mesh, tileTransform, context, key, enableTileStencil) {
            mesh.properties.tileTransform = tileTransform;
            mesh.properties.createTime = context.timestamp;
            mesh.properties.meshKey = key;
            if (enableTileStencil) {
                const defines = mesh.defines || {};
                defines['ENABLE_TILE_STENCIL'] = 1;
                mesh.setDefines(defines);
                Object.defineProperty(mesh.uniforms, 'stencilRef', {
                    enumerable: true,
                    get: function () {
                        return mesh.properties.tile ? mesh.properties.tile.stencilRef : 255;
                    }
                });
            }
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

        // 返回true，则重刷图层，重新构造瓦片mesh
        // 返回false，则只是请求重绘
        updateDataConfig: function (dataConfig, old) {
            var painter = this.painter;
            if (painter) {
                return painter.updateDataConfig(dataConfig, old);
            }
            return true;
        },

        updateSymbol: function (symbol, all) {
            var painter = this.painter;
            if (!painter) {
                return;
            }
            if (painter.shouldDeleteMeshOnUpdateSymbol(symbol)) {
                if (this._meshCache) {
                    for (var key in this._meshCache) {
                        painter.deleteMesh(this._meshCache[key], true);
                    }
                }
                delete this._meshCache;
                delete this._frameCache;
            }
            painter.updateSymbol(symbol, all);
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

        resize: function (width, height) {
            var painter = this.painter;
            if (painter) {
                painter.resize(width, height);
            }
        },

        needToRedraw: function () {
            if (!this.painter) {
                return false;
            }
            return this.painter.needToRedraw();
        },

        needToRetireFrames: function () {
            if (!this.painter) {
                return false;
            }
            return this.painter.needToRetireFrames();
        },

        _generateColorArray: function (features, featureIndexes, indices, vertices, positionSize = 3) {
            if (!vertices || !features || !featureIndexes.length) {
                return null;
            }
            // var myColors = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];
            var colors = new Uint8Array(vertices.length / positionSize * 4);
            var symbol, rgb;
            const colorSymbol = this.painter.colorSymbol;
            var visitedColors = {};
            var pos;
            for (var i = 0, l = featureIndexes.length; i < l; i++) {
                var idx = featureIndexes[i];
                symbol = features[idx].symbol;
                rgb = visitedColors[idx];
                if (!rgb) {
                    // var color = Color(myColors[features[idx].feature.id % myColors.length]);
                    // rgb = visitedColors[idx] = color.array();
                    // if (symbol[this.painter.colorSymbol]) {
                    //     var color = Color(symbol[this.painter.colorSymbol]);
                    //     rgb = visitedColors[idx] = color.array();
                    // } else {
                    //     rgb = visitedColors[idx] = [255, 255, 255];
                    // }

                    if (colorSymbol) {
                        let color;
                        if (typeof colorSymbol === 'function') {
                            color = colorSymbol(features[idx].feature && features[idx].feature.properties);
                        } else {
                            color = colorSymbol;
                        }
                        color = Color(color);
                        rgb = visitedColors[idx] = color.array();
                    } else {
                        rgb = visitedColors[idx] = [255, 255, 255];
                    }
                }
                pos = i * 4;
                colors[pos] = rgb[0];
                colors[pos + 1] = rgb[1];
                colors[pos + 2] = rgb[2];
                colors[pos + 3] = 255 * (symbol[this.painter.opacitySymbol] || 1);
            }
            return colors;
        },

        _getMeshKey: function (context) {
            var tileInfo = context.tileInfo;
            var pluginIndex = context.pluginIndex;
            return pluginIndex + '-' + tileInfo.id;
        },

        _getMesh: function (key) {
            return this._meshCache[key];
        },

        _filterElements(geometry, glData) {
            if (Array.isArray(geometry)) {
                geometry.forEach((g, idx) => {
                    const { features } = g.properties;
                    this._filterGeoElements(g, glData[idx], features);
                });
            } else {
                const { features } = geometry.properties;
                this._filterGeoElements(geometry, Array.isArray(glData) ? glData[0] : glData, features);
            }
        },

        _filterGeoElements(geometry, glData, features) {
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
        },

        outline(fbo, featureIds) {
            var painter = this.painter;
            if (painter) {
                painter.outline(fbo, featureIds);
            }
        },

        outlineAll(fbo) {
            var painter = this.painter;
            if (painter) {
                painter.outlineAll(fbo);
            }
        },

        needPolygonOffset() {
            var painter = this.painter;
            return painter && painter.needPolygonOffset();
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

//zoom :  z - 2 | z - 1 | z | z + 1 | z + 2
//level:    4       2     0     1       3
export function getUniformLevel(z, currentTileZoom) {
    // return z - currentTileZoom > 0 ? 2 * (z - currentTileZoom) - 1 : 2 * (currentTileZoom - z);
    // return currentTileZoom - (z - 64);
    //为了解决瓦片模板冲突问题，相差1级的瓦片之间是没有重叠的
    return z - currentTileZoom >= -2 ? 0 : (currentTileZoom - z);
}
