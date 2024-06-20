import easing from 'animation-easings';
import { createFilter } from '@maptalks/feature-filter';
import VectorTilePlugin from '@maptalks/vt-plugin';
import { Color } from '@maptalks/vector-packer';

const DEFAULT_ANIMATION_DURATION = 800;

const NO_REDRAW = {
    redraw: false,
    retire: false
};

const EMPTY_ARRAY = [];

let meshUID = 1;
/**
 * Create a VT Plugin with a given painter
 */
function createPainterPlugin(type, Painter) {
    const PainterPlugin = VectorTilePlugin.extend(type, {

        init: function () {
            this._meshCache = {};
        },

        isVisible() {
            return this.painter && this.painter.isVisible();
        },

        supportRenderMode: function (mode) {
            return this.painter.supportRenderMode(mode);
        },

        hasMesh() {
            return this.painter && this.painter.hasMesh();
        },

        startFrame: function (context) {
            const layer = context.layer,
                regl = context.regl,
                sceneConfig = context.sceneConfig,
                dataConfig = context.dataConfig,
                symbol = context.symbol;
            let painter = this.painter;
            if (!painter) {
                const pluginIndex = context.pluginIndex;
                painter = this.painter = new Painter(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig);
            }
            if (!this._meshCache) {
                this._meshCache = {};
            }
            const excludes = sceneConfig.excludes;
            if (!this._excludes) {
                if (excludes) {
                    this._excludes = excludes;
                }
            } else if (excludes !== this._excludes) {
                this._excludesFunc = excludes ? createFilter(excludes) : null;
                this._excludes = excludes;
            }
            //先清除所有的tile mesh, 在后续的paintTile中重新加入，每次只绘制必要的tile
            painter.startFrame(context);
            this._frameCache = {};
        },

        updateCollision: function (context) {
            const painter = this.painter;
            if (painter && painter.isVisible()) {
                return painter.updateCollision(context);
            }
            return null;
        },

        prepareRender: function (context) {
            const painter = this.painter;
            if (painter && painter.isVisible()) {
                return painter.prepareRender(context);
            }
            return null;
        },

        endFrame: function (context) {
            const painter = this.painter;
            if (painter && painter.isVisible()) {
                return painter.render(context);
            }
            return null;
        },

        getShadowMeshes() {
            const painter = this.painter;
            if (!painter || !painter.getShadowMeshes) {
                return EMPTY_ARRAY;
            }
            return painter.getShadowMeshes() || EMPTY_ARRAY;
        },

        createTile: function (context) {
            const {
                tileCache,
                tileData,
            } = context;
            let retire = false;
            const painter = this.painter;
            if (!painter) {
                return { retire };
            }
            const key = this._getMeshKey(context);
            let geometries = tileCache.geometry;
            if (!geometries) {
                const features = tileData.features;
                const glData = tileData.data;
                if (!glData || !glData.length) {
                    return { retire };
                }
                const data = glData;
                // 目前只有native-line和wireframe会用到
                if (this.painter.colorSymbol && !isObjectEmpty(features)) {
                    for (let i = 0; i < glData.length; i++) {
                        const colors = this._generateColorArray(features, glData[i].data.aPickingId, glData[i].indices, glData[i].data.aPosition, glData[i].positionSize);
                        glData[i].data.aColor = colors;
                    }
                }
                geometries = tileCache.geometry = painter.createGeometries(data, features);
                for (let i = 0; i < geometries.length; i++) {
                    if (geometries[i] && geometries[i].geometry) {
                        retire = true;
                        geometries[i].geometry.properties.features = features;
                        this._fillCommonProps(geometries[i].geometry, context);
                    }
                }
            }

            let meshes = this._getMesh(key);
            if (!meshes) {
                const { meshes: newMeshes, retire: isRetire } = this._createMeshes(geometries, context);
                if (!retire) {
                    retire = isRetire;
                }
                meshes = newMeshes;
            }
            return { retire };
        },

        _createMeshes(geometries, context) {
             const {
                tileInfo,
                tileExtent,
                tileTransform,
                tileTranslationMatrix,
                tileVectorTransform,
                tileZoom,
                sceneConfig
            } = context;
            let retire = false;
            const painter = this.painter;
            const tilePoint = [tileInfo.extent2d.xmin, tileInfo.extent2d.ymax];
            const meshes = painter.createMeshes(geometries, tileTransform, { tileExtent, tilePoint, tileZoom, tileTranslationMatrix, tileVectorTransform }, context);
            if (meshes.length) {
                for (let i = 0; i < meshes.length; i++) {
                    if (meshes[i]) {
                        retire = true;
                        this._fillMeshProps(meshes[i], tileTransform, context.timestamp, meshUID++, painter.isEnableTileStencil());
                    }
                }
                if (sceneConfig.animation) {
                    meshes._animationTime = context.timestamp;
                }
                const key = this._getMeshKey(context);
                this._meshCache[key] = meshes;
            }
            return { meshes, retire };
        },

        paintTile: function (context) {
            const {
                tileCache,
                tileInfo,
                tileZoom,
                sceneConfig
            } = context;
            const painter = this.painter;
            if (!painter) {
                return NO_REDRAW;
            }

            let geometries = tileCache.geometry;
            if (!geometries) {
                return NO_REDRAW;
            }
            let retire = false;
            const key = this._getMeshKey(context);
            let meshes = this._getMesh(key);
            if (!meshes) {
                const { meshes: newMeshes, retire: isRetire } = this._createMeshes(geometries, context);
                if (!retire) {
                    retire = isRetire;
                }
                meshes = newMeshes;
            }
            if (!meshes.length) {
                return NO_REDRAW;
            }

            //更新stencil level值，不同zoom会发生变化
            const level = painter.getTileLevelValue(tileInfo, tileZoom);//getUniformLevel(tileInfo.z, tileZoom);
            meshes.forEach(m => {
                // 保留一些有用的信息
                m.properties.tile = tileInfo;
                m.properties.level = level;
            });

            let redraw = false;
            if (!this._frameCache[key]) {
                let progress = null;
                let animation = sceneConfig.animation;
                if (animation) {
                    const duration = context.sceneConfig.animationDuration || DEFAULT_ANIMATION_DURATION;
                    const t = (context.timestamp - meshes._animationTime) / duration;
                    const createTime = meshes[0].properties.createTime;
                    if (meshes._animationTime - createTime < duration && t < 1) {
                        if (animation === true || animation === 1) {
                            animation = 'linear';
                        }
                        progress = animation === 'linear' ? t : easing(animation, t);
                        redraw = true;
                    }
                }

                painter.addMesh(meshes, progress, context);
                this._frameCache[key] = 1;
            }

            return {
                redraw,
                retire
            };
        },

        _fillMeshProps: function (mesh, tileTransform, timestamp, key, enableTileStencil) {
            mesh.properties.tileTransform = tileTransform;
            mesh.properties.createTime = timestamp;
            mesh.properties.meshKey = key;
            mesh.needUpdateShadow = true;
            if (enableTileStencil) {
                const defines = mesh.defines || {};
                defines['ENABLE_TILE_STENCIL'] = 1;
                mesh.setDefines(defines);
            }
            if (!('stencilRef' in mesh.uniforms)) {
                Object.defineProperty(mesh.uniforms, 'stencilRef', {
                    enumerable: true,
                    get: function () {
                        // return mesh.properties.tile ? mesh.properties.tile.stencilRef : 255;
                        if (mesh.properties.tile && mesh.properties.tile.stencilRef !== undefined) {
                            return mesh.properties.tile.stencilRef;
                        }
                        // return maxZoom - mesh.properties.tile.z;
                        return mesh.properties.level;
                    }
                });
            }
        },

        _fillCommonProps: function (geometry, context) {
            const { layer, tileInfo } = context;
            const map = layer.getMap(),
                sr = layer.getSpatialReference ? layer.getSpatialReference() : map.getSpatialReference(),
                tileResolution = sr.getResolution(tileInfo.z),
                tileRatio = context.tileExtent / layer.getTileSize().width;
            geometry.properties.tileResolution = tileResolution;
            geometry.properties.tileRatio = tileRatio;
            geometry.properties.z = tileInfo.z;
            geometry.properties.tileExtent = context.tileExtent;
        },

        updateSceneConfig: function (context) {
            const painter = this.painter;
            if (painter) {
                painter.updateSceneConfig(context.sceneConfig);
            }
        },

        // 返回true，则重刷图层，重新构造瓦片mesh
        // 返回false，则只是请求重绘
        updateDataConfig: function (dataConfig, old) {
            const painter = this.painter;
            if (painter) {
                return painter.updateDataConfig(dataConfig, old);
            }
            return true;
        },

        updateSymbol: function (symbol, all) {
            const painter = this.painter;
            if (!painter) {
                return false;
            }
            if (painter.shouldDeleteMeshOnUpdateSymbol(symbol)) {
                if (this._meshCache) {
                    for (const key in this._meshCache) {
                        painter.deleteMesh(this._meshCache[key], true);
                    }
                }
                delete this._meshCache;
                delete this._frameCache;
            }
            return painter.updateSymbol(symbol, all);
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
            const key = this._getMeshKey(context);
            const mesh = this._meshCache[key];
            if (mesh && this.painter) {
                this.painter.deleteMesh(mesh);
            }
            delete this._meshCache[key];
            if (this._frameCache) {
                delete this._frameCache[key];
            }
        },

        remove: function () {
            const painter = this.painter;
            if (painter && this._meshCache) {
                for (const key in this._meshCache) {
                    painter.deleteMesh(this._meshCache[key]);
                }
                painter.delete();
                delete this.painter;
            }
            delete this._meshCache;
            delete this._frameCache;
        },

        resize: function (width, height) {
            const painter = this.painter;
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

        isAnimating() {
           if (!this.painter) {
                return false;
            }
            return this.painter.isAnimating();
        },

        needToRefreshTerrainTileOnZooming: function () {
            if (!this.painter) {
                return false;
            }
            return this.painter.needToRefreshTerrainTileOnZooming();
        },

        isTerrainSkin: function () {
            if (!this.painter) {
                return false;
            }
            return this.painter.isTerrainSkin();
        },

        isTerrainVector: function () {
            if (!this.painter) {
                return false;
            }
            return this.painter.isTerrainVector();
        },


        _generateColorArray: function (features, featureIndexes, indices, vertices, positionSize = 3) {
            if (!vertices || !features || !featureIndexes.length) {
                return null;
            }
            // const myColors = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];
            const colors = new Uint8Array(vertices.length / positionSize * 4);
            let symbol, rgb;
            const colorSymbol = this.painter.colorSymbol;
            const visitedColors = {};
            let pos;
            for (let i = 0, l = featureIndexes.length; i < l; i++) {
                const idx = featureIndexes[i];
                symbol = features[idx].symbol;
                rgb = visitedColors[idx];
                if (!rgb) {
                    // const color = Color(myColors[features[idx].feature.id % myColors.length]);
                    // rgb = visitedColors[idx] = color.array();
                    // if (symbol[this.painter.colorSymbol]) {
                    //     const color = Color(symbol[this.painter.colorSymbol]);
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
            const tileInfo = context.tileInfo;
            // const pluginIndex = context.pluginIndex;
            const meshKey = tileInfo.meshKey;
            if (!meshKey) {
                tileInfo.meshKey = meshUID++;
            }
            return tileInfo.meshKey;
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
            const featureIndexes = glData.featureIndexes || glData.data.featureIndexes;
            if (!featureIndexes) return;
            if (this._excludesFunc) {
                const indices = glData.indices;
                let pre = null,
                    excluded = false;
                const elements = [];
                for (let i = 0; i < indices.length; i++) {
                    const feature = features[featureIndexes[indices[i]]];
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

        outline(fbo, featureIds) {
            const painter = this.painter;
            if (painter) {
                painter.outline(fbo, featureIds);
            }
        },

        outlineAll(fbo) {
            const painter = this.painter;
            if (painter) {
                painter.outlineAll(fbo);
            }
        },

        needPolygonOffset() {
            const painter = this.painter;
            return painter && painter.needPolygonOffset();
        },

        highlight(highlights) {
            const painter = this.painter;
            const name = this.style.name;
            const pluginIndex = this.renderIndex;
            if (highlights) {
                const excludes = [];
                highlights.forEach((value, key) => {
                    if (value.plugin !== undefined && value.plugin !== null) {
                        if (Array.isArray(value.plugin)) {
                            if (value.plugin.length && value.plugin.indexOf(name) < 0 && value.plugin.indexOf(pluginIndex) < 0) {
                                excludes.push(key)
                            }
                        } else if (value.plugin !== name && value.plugin !== pluginIndex) {
                            excludes.push(key)
                        }
                    }
                });
                if (excludes.length) {
                    const filtered = new Map(highlights);
                    for (let i = 0; i < excludes.length; i++) {
                        filtered.delete(excludes[i]);
                    }
                    highlights = filtered;
                }
            }
            return painter && painter.highlight(highlights);
        },

        cancelAllHighlight() {
            const painter = this.painter;
            return painter && painter.cancelAllHighlight();
        }
    });

    return PainterPlugin;
}

export default createPainterPlugin;

export function extend(dest) {
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
        for (const k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}

function isObjectEmpty(obj) {
    if (!obj) {
        return true;
    }
    for (const p in obj) return false;
    return true;
}
