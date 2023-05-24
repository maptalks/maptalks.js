import * as maptalks from 'maptalks';
import TerrainWorkerConnection from './TerrainWorkerConnection';
import { createREGL } from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';
import skinVert from './glsl/terrainSkin.vert';
import skinFrag from './glsl/terrainSkin.frag';
import { getCascadeTileIds, getSkinTileScale, getSkinTileRes, inTerrainTile } from './TerrainTileUtil';
import  { extend } from '../util/util';
import TerrainPainter from './TerrainPainter';
import TerrainLitPainter from './TerrainLitPainter';

const POINT0 = new maptalks.Point(0, 0);
const POINT1 = new maptalks.Point(0, 0);
const TEMP_EXTENT = new maptalks.PointExtent(0, 0, 0, 0);
const TEMP_POINT = new maptalks.Point(0, 0);

const DEBUG_POINT = new maptalks.Point(20, 20);

const TERRAIN_CLEAR = {
    color: [0, 0, 0, 0],
    depth: 1,
    stencil: 0
};

class TerrainLayerRenderer extends maptalks.renderer.TileLayerCanvasRenderer {

    isDrawable() {
        return true;
    }

    consumeTile(tileImage, tileInfo) {
        if (tileImage && tileImage.mesh && !tileImage.terrainMesh) {
            tileImage.terrainMesh = this._painter.createTerrainMesh(tileInfo, tileImage.mesh, tileImage.image);
            delete tileImage.mesh;
            tileInfo.minAltitude = tileImage.data.min;
            tileInfo.maxAltitude = tileImage.data.max;
            const tileInfoCache = this.layer.tileInfoCache;
            if (tileInfoCache && tileInfo.parentNodeId) {
                const parentNode = tileInfoCache.get(tileInfo.parentNodeId);
                if (parentNode) {
                    if (parentNode.minAltitude === undefined) {
                        parentNode.minAltitude = tileInfo.minAltitude;
                    }
                    if (parentNode.maxAltitude === undefined) {
                        parentNode.maxAltitude = tileInfo.maxAltitude;
                    }
                }
            }
        }
        super.consumeTile(tileImage, tileInfo);
        const map = this.getMap();
        if (map.updateCenterAltitude && map.centerAltitude === undefined && tileInfo.z === this.getCurrentTileZoom()) {
            const prjCenter = map['_getPrjCenter']();
            const centerPoint = map['_prjToPointAtRes'](prjCenter, tileInfo.res, TEMP_POINT);
            if (tileInfo.extent2d.contains(centerPoint)) {
                map.updateCenterAltitude();
            }
        }
    }

    draw(timestamp, parentContext) {
        this._createPainter();
        this._painter.startFrame();
        super.draw(timestamp, parentContext);
        this._endFrame(parentContext);
    }

    drawTile(tileInfo, tileImage) {
        const map = this.getMap();
        if (!tileInfo || !map || !tileImage) {
            return;
        }
        let opacity = this.drawingCurrentTiles ? this.getTileOpacity(tileImage) : 1;
        opacity *= (this.layer.options.opacity || 1);
        this._painter.addTerrainImage(tileInfo, tileImage, opacity);
    }

    _drawTiles(tiles, parentTiles, childTiles) {
        this._newTerrainTileCounter = 0;
        const skinCount = this.layer.getSkinCount();
        const allTiles = tiles.concat(parentTiles).concat(childTiles);
        const visitedSkinTiles = new Set();
        // 集中对每个SkinLayer调用renderTerrainSkin，减少 program 的切换开销
        for (let i = 0; i < skinCount; i++) {
            this._renderChildTerrainSkin(i, allTiles, visitedSkinTiles);
        }
        for (let i = 0; i < allTiles.length; i++) {
            this._renderTerrainMeshSkin(allTiles[i].info, allTiles[i].image);
        }
        return super._drawTiles(...arguments);
    }

    _prepareChildTerrainSkin(skinIndex, terrainTileInfo, tileImage) {
        const map = this.getMap();
        if (!terrainTileInfo || !map || !tileImage) {
            return false;
        }
        const mesh = tileImage.terrainMesh;
        if (!mesh) {
            return false;
        }
        const skinLayer = this.layer.getSkinLayer(skinIndex);
        const renderer = skinLayer.getRenderer();
        if (!renderer) {
            return false;
        }
        if (!tileImage.skinImages) {
            if (map.isInteracting()) {
                const limit = this.layer.options['newTerrainTileRenderLimitPerFrameOnInteracting'];
                if (limit > 0 && this._newTerrainTileCounter > limit) {
                    return false;
                }
            }
            tileImage.skinImages = [];
        }
        if (!tileImage.skinStatus) {
            tileImage.skinStatus = [];
        }
        if (!tileImage.skinTileIds) {
            tileImage.skinTileIds = [];
        }
        const status = tileImage.skinStatus[skinIndex];
        const needRefresh = renderer.needToRefreshTerrainTile && renderer.needToRefreshTerrainTile();
        if (!needRefresh && status) {
            return false;
        }
        const sr = skinLayer.getSpatialReference();
        const { x, y, z, res, offset } = terrainTileInfo;
        const tileSize = this.layer.getTileSize().width;
        // const zoom = this.getCurrentTileZoom();
        const { res: myRes, zoom } = getSkinTileRes(sr, z, res);

        const myTileSize = skinLayer.getTileSize().width;

        const scale = getSkinTileScale(myRes, myTileSize, res, tileSize);

        let skinTileIds = tileImage.skinTileIds[skinIndex];
        if (!skinTileIds) {
            skinTileIds = tileImage.skinTileIds[skinIndex] = getCascadeTileIds(skinLayer, x, y, zoom, offset, scale, SKIN_LEVEL_LIMIT);
        }
        const level0 = skinTileIds['0'];
        let complete = true;
        const tiles = [];
        for (let i = 0; i < level0.length; i++) {
            const tileId = level0[i].id;
            const cachedTile = renderer.tileCache.get(tileId);
            if (!cachedTile) {
                complete = false;
                continue;
            }
            // if (!cachedTile.info.terrainTileInfos) {
            //     // 预先存好terrain的tileIndex，vt图层中查询高程时，无需再单独计算
            //     cachedTile.info.terrainTileInfos = [];
            // }
            // if (cachedTile.info.terrainTileInfos.indexOf(terrainTileInfo) < 0) {
            //     cachedTile.info.terrainTileInfos.push(terrainTileInfo);
            // }
            tiles.push(cachedTile);
        }
        let updated = false;
        const skinImages = tileImage.skinImages[skinIndex] || [];
        if (skinImages.length < tiles.length) {
            const set = new Set();
            for (let i = 0; i < skinImages.length; i++) {
                set.add(skinImages[i].tile.info.id);
            }
            // 为每个 skin tile 创建一个 skin texture
            // 当 skin tile 范围比 terrain tile 更大时，每个 skin tile 只需绘制一次
            for (let i = 0; i < tiles.length; i++) {
                if (set.has(tiles[i].info.id)) {
                    continue;
                }
                let cached = this._getCachedSkinImage(tiles[i].info.id);
                if (!cached) {
                    cached = {
                        tile: extend({}, tiles[i]),
                        layer: skinLayer,
                        refCount: 0,
                        texture: renderer.createTerrainTexture(this.regl)
                    };
                    this._saveCachedSkinImage(tiles[i].info.id, cached);
                }
                cached.refCount++;
                skinImages.push(cached);
                updated = true;
            }
        }
        if (updated) {
            this._newTerrainTileCounter++;
        }
        tileImage.skinImages[skinIndex] = skinImages;

        skinLayer.fire('renderterrainskin', { tile: terrainTileInfo, skinTiles: tiles });

        if (complete) {
            tileImage.skinStatus[skinIndex] = 1;
            // save some memory
            // if (!needRefresh) {
            //     tileImage.skinTileIds = [];
            //     tileImage.skinImages[skinIndex] = null;
            // }
        }
        return true;
    }

    _getCachedSkinImage(id) {
        if (!this._skinImageCache) {
            this._skinImageCache = new Map();
        }
        return this._skinImageCache.get(id);
    }

    _saveCachedSkinImage(id, cached) {
        this._skinImageCache.set(id, cached);
    }

    _renderChildTerrainSkin(skinIndex, terrainTiles, visitedSkinTiles) {
        const layerSkinImages = [];
        for (let i = 0; i < terrainTiles.length; i++) {
            const { info, image } = terrainTiles[i];
            if (this._prepareChildTerrainSkin(skinIndex, info, image)) {
                const skinImages = terrainTiles[i].image.skinImages[skinIndex];
                for (let j = 0; j < skinImages.length; j++) {
                    const tileId = skinImages[j].tile.info.id;
                    // 检查是否存在重复的瓦片，重复的瓦片只需要绘制一次
                    if (!visitedSkinTiles.has(tileId)) {
                        layerSkinImages.push(skinImages[j]);
                        visitedSkinTiles.add(tileId);
                    }
                }
            }
        }
        const skinLayer = this.layer.getSkinLayer(skinIndex);
        const renderer = skinLayer.getRenderer();
        // render terrain skin of skin layer
        renderer.renderTerrainSkin(this.regl, this.layer, layerSkinImages);
    }

    _renderTerrainMeshSkin(terrainTileInfo, tileImage) {
        // render a terrain tile's skin
        const map = this.getMap();
        if (!terrainTileInfo || !map || !tileImage) {
            return;
        }
        const skinImages = tileImage.skinImages;
        // if (!skinImages) {
        //     return;
        // }
        if (tileImage.rendered && !this._needRefreshTerrainSkins()) {
            return;
        }
        if (!tileImage.skin) {
            tileImage.skin = this._createTerrainTexture();

        } else {
            TERRAIN_CLEAR.framebuffer = tileImage.skin;
            this.regl.clear(TERRAIN_CLEAR);
        }
        this._initSkinShader();
        const enableDebug = this.layer.options.debug;
        const meshes = [];
        const debugMeshes = enableDebug && [];

        const tileSize = this.layer.getTileSize().width;
        if (skinImages) {
            for (let i = 0; i < skinImages.length; i++) {
                const layerSkinImages = skinImages[i];
                for (let ii = 0; ii < layerSkinImages.length; ii++) {
                    const { tile, texture } = layerSkinImages[ii];
                    const skinDim = computeSkinDimension(terrainTileInfo, tile, tileSize);
                    const mesh = layerSkinImages[ii].skinMesh || new reshader.Mesh(this._skinGeometry);
                    mesh.setUniform('skinTexture', texture);
                    mesh.setUniform('skinDim', skinDim);
                    mesh.setUniform('tileSize', tileSize);
                    layerSkinImages[ii].skinMesh = mesh;
                    meshes.push(mesh);
                }
            }
        }
        if (enableDebug) {
            const debugMesh = tileImage.skinDebugMesh || new reshader.Mesh(this._skinGeometry);
            debugMesh.setUniform('tileSize', tileSize);
            const debugTexture = tileImage.debugTexture || this._createDebugTexture(terrainTileInfo, tileSize);
            tileImage.debugTexture = debugTexture;
            tileImage.skinDebugMesh = debugMesh;
            debugMesh.setUniform('skinTexture', debugTexture);
            debugMesh.setUniform('skinDim', [0, 0, 1]);
            debugMesh.setUniform('tileSize', tileSize);
            debugMeshes.push(debugMesh);
        }
        if (meshes.length) {
            this._skinScene.setMeshes(meshes);
            this.renderer.render(this._skinShader, null, this._skinScene, tileImage.skin);
        }

        if (debugMeshes && debugMeshes.length && this.layer.options.debug) {
            this._skinScene.setMeshes(debugMeshes);
            this.renderer.render(this._skinShader, null, this._skinScene, tileImage.skin);
        }

        tileImage.rendered = this._isSkinReady(tileImage);
    }

    _createDebugTexture(tileInfo, tileSize) {
        tileSize *= 2;

        const { x, y, z } = tileInfo;
        const debugInfo = `terrain:${x}/${y}/${z}`;

        const canvas = document.createElement('canvas');
        canvas.width = tileSize;
        canvas.height = tileSize;
        const ctx = canvas.getContext('2d');
        ctx.font = '40px monospace';

        const color = this.layer.options['debugOutline'];
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.fillText(debugInfo, 20, tileSize - 40);
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.moveTo(0, 0);
        ctx.lineTo(tileSize, 0);
        ctx.lineTo(tileSize, tileSize);
        ctx.lineTo(0, tileSize);
        ctx.lineTo(0, 0);
        ctx.stroke();

        return this.regl.texture({
            data: canvas,
            flipY: true,
            mag: 'linear',
            min: 'linear'
        });
    }

    _createTerrainTexture() {
        const tileSize = this.layer.getTileSize().width;
        // 乘以2是为了瓦片（缩放时）被放大后保持清晰度
        const width = tileSize * 2;
        const height = tileSize * 2;
        const regl = this.regl;
        const color = regl.texture({
            min: 'linear',
            mag: 'linear',
            type: 'uint8',
            width,
            height,
            flipY: true
        });
        const fboInfo = {
            width,
            height,
            colors: [color],
            // stencil: true,
            // colorCount,
            colorFormat: 'rgba',
            ignoreStatusCheck: true,
            depthStencil: false,
            depth: false,
            stencil: false
        };
        const texture = regl.framebuffer(fboInfo);
        texture.colorTex = color;
        return texture;
    }

    _endFrame(context) {
        const renderCount = this._painter.endFrame(context);
        if (renderCount && !Object.keys(this.tilesLoading).length) {
            this.layer.fire('terrainreadyandrender');
        }
    }

    _findParentAvailableTile(tile) {
        const maxAvailableZoom = this.layer.options['maxAvailableZoom'];
        let z = tile.z;
        let cached;
        while(z > maxAvailableZoom && tile) {
            cached = this['_findParentTile'](tile);
            tile = cached && cached.info;
            z = tile && tile.z;
        }
        return cached;
    }

    // _findParentTileInfo(tile) {

    // }

    _clipParentTerrain(parentTile, tile) {
        const { image, info } = parentTile;
        const terrainData = image.data;
        const terrainWidth = terrainData.width;
        const { extent2d: parentExtent, res: parentRes } = info;
        const { extent2d, res } = tile;
        const width = parentExtent.getWidth();
        const height = parentExtent.getHeight();
        let xmin = (extent2d.xmin * res / parentRes - parentExtent.xmin) / width * terrainWidth;
        let ymin = (parentExtent.ymax - extent2d.ymax * res / parentRes) / height * terrainWidth;
        const xmax = (extent2d.xmax * res / parentRes - parentExtent.xmin) / width * terrainWidth;

        const tileWidth = Math.ceil(xmax - xmin);
        xmin = Math.floor(xmin);
        ymin = Math.floor(ymin);
        // 先行再列
        const heights = new Float32Array(tileWidth * tileWidth);
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < tileWidth; i++) {
            for (let j = 0; j < tileWidth; j++) {
                const height = terrainData.data[(i + xmin) + (ymin + j) * terrainWidth];
                heights[i + j * tileWidth] = height;
                if (height < min) {
                    min = height;
                }
                if (height > max) {
                    max = height;
                }
            }
        }
        return {
            width: tileWidth,
            height: tileWidth,
            data: heights,
            min,
            max
        };
    }

    getTileOpacity(tileImage) {
        if (!this._isSkinReady(tileImage)) {
            this.resetTileLoadTime(tileImage);
            return 0;
        }
        return super.getTileOpacity(tileImage);
    }

    _isSkinReady(tileImage) {
        const skinCount = this.layer.getSkinCount();
        if (!skinCount) {
            return true;
        }
        if (!tileImage.skinStatus) {
            // 还没有初始化
            return false;
        }
        for (let i = 0; i < skinCount; i++) {
            if (!tileImage.skinStatus[i]) {
                return false;
            }
        }
        return true;
    }

    _needRefreshTerrainSkins() {
        const skinLayers = this.layer.getSkinLayers();
        for (let i = 0; i < skinLayers.length; i++) {
            const renderer = skinLayers[i] && skinLayers[i].getRenderer();
            if (!renderer) {
                continue;
            }
            if (renderer.needToRefreshTerrainTile && renderer.needToRefreshTerrainTile()) {
                return true;
            }
        }
        return false;
    }

    isTileComplete(tile) {
        return tile.image && this._isSkinReady(tile.image);
    }

    loadTile(tile) {
        const maxAvailableZoom = this.layer.options['maxAvailableZoom'];
        const sp = this.layer.getSpatialReference();
        const res = sp.getResolution(tile.z);
        if (maxAvailableZoom && tile.z > maxAvailableZoom) {
            const parentTile = this._findParentAvailableTile(tile);
            if (parentTile && parentTile.image && parentTile.image.data) {
                // clip
                const childTileHeights = this._clipParentTerrain(parentTile, tile);
                const terrainData = {};
                this.workerConn.createTerrainMesh({
                    terrainHeights: childTileHeights,
                    terrainWidth: this.layer.options.tileSize + 1,
                    error: res
                }, (err, resource) => {
                    if (err) {
                        if (err.canceled) {
                            return;
                        }
                        console.warn(err);
                        this.onTileError(terrainData, tile);
                        return;
                    }
                    maptalks.Util.extend(terrainData, resource);
                    this.consumeTile(terrainData, tile);
                    this.setToRedraw();
                });
                return terrainData;
            } else {
                // const parentTileInfo = this._findParentTileInfo(tile);

            }
        }
        const terrainUrl = tile.url;
        const terrainData = {};

        const options = {
            terrainWidth: (this.layer.options.tileSize + 1),
            type: this.layer.options.type,
            accessToken: this.layer.options.accessToken,
            error: res,
            maxAvailable: maxAvailableZoom === tile.z
        };
        this.workerConn.fetchTerrain(terrainUrl, options, (err, resource) => {
            if (err) {
                if (err.canceled) {
                    return;
                }
                console.warn(err);
                this.onTileError(terrainData, tile);
                return;
            }
            maptalks.Util.extend(terrainData, resource);
            this.consumeTile(terrainData, tile);
            this.setToRedraw();
        });
        return terrainData;
    }

    deleteTile(tile) {
        if (!tile || !tile.image) {
            return;
        }
        const { info, image } = tile;
        delete info.skinTileIds;
        const skin = image.skin;
        if (skin) {
            skin.destroy();
            skin.colorTex.destroy();
            delete skin.colorTex;
        }
        if (image.debugTexture) {
            image.debugTexture.destroy();
            delete image.debugTexture;
            image.skinDebugMesh.dispose();
            delete image.skinDebugMesh;
        }
        const skinImages = image.skinImages;
        if (skinImages && skinImages.length) {
            for (let i = 0; i < skinImages.length; i++) {
                const layerSkinImages = skinImages[i];
                if (!layerSkinImages) {
                    continue;
                }
                for (let ii = 0; ii < layerSkinImages.length; ii++) {
                    if (!layerSkinImages[ii]) {
                        continue;
                    }
                    const skinTileId = layerSkinImages[ii].tile.info.id;
                    const cached = this._skinImageCache && this._skinImageCache.get(skinTileId);
                    if (cached) {
                        cached.refCount--;
                        if (cached.refCount <= 0) {
                            const renderer = cached.layer.getRenderer();
                            delete cached.canvas;
                            if (cached.texture) {
                                renderer.deleteTerrainTexture(cached.texture);
                                delete cached.texture;
                            }
                            if (cached.skinMesh) {
                                cached.skinMesh.dispose();
                                delete cached.skinMesh;
                            }
                            if (renderer) {
                                if (renderer.removeTileCache) {
                                    renderer.removeTileCache(skinTileId);
                                }
                                if (renderer.deleteTile) {
                                    renderer.constructor.prototype.deleteTile.call(renderer, cached.tile);
                                }
                            }
                            this._skinImageCache.delete(skinTileId);
                        }
                    }
                }
                layerSkinImages.length = 0;
            }
        }
        if (image.terrainMesh) {
            image.terrainMesh.geometry.dispose();
            image.terrainMesh.dispose();
        }
        if (image.image && image.image.close) {
            // imageBitmap
            image.image.close();
        }
        delete image.skinImages;
        delete image.skin;
        delete image.skinStatus;        
        delete image.skinTileIds;
        delete image.terrainMesh;
        delete image.image;
        delete image.data;
        delete image.rendered;
    }

    abortTileLoading(tileImage, tileInfo) {
        if (tileInfo && tileInfo.url) {
            if (this.workerConn) {
                this.workerConn.abortTerrain(tileInfo.url);
            }
        }
        super.abortTileLoading(tileImage, tileInfo);
    }

    onTileError(data, tile)  {
        // TODO
        super.onTileError(data, tile);
    }

    _getTerrainTileAtPoint(point, res) {
        const cache = this.tileCache.data;
        const values = cache.values();
        for (const tile of values) {
            if (inTerrainTile(tile.info, point.x, point.y, res)) {
                return tile.info;
            }
        }
        return null;
    }

    _queryTerrain(out, terrainTileId, tileIndex, worldPos, res) {
        const minZoom = this.layer.getMinZoom();
        const terrainData = this._findTerrainData(terrainTileId, tileIndex.x, tileIndex.y, tileIndex.z, minZoom);
        if (terrainData && terrainData.image && terrainData.image.data) {
            const extent2d = terrainData.info.extent2d;
            const terrainRes = terrainData.info.res;
            const scale = terrainRes / res;
            const x = worldPos.x - extent2d.xmin * scale;
            const y = extent2d.ymax * scale - worldPos.y;
            const altitude = this._queryAltitudeInHeights(terrainData.image.data, x / (extent2d.getWidth() * scale), y / (extent2d.getHeight() * scale));
            out[0] = altitude;
            out[1] = altitude === null ? 0 : +(terrainData.info.z === tileIndex.z);
        } else {
            out[0] = null;
            out[1] = 0;
        }
        return out;
    }

    _findTerrainData(terrainTileId, x, y, z, limit) {
        if (!terrainTileId) {
            terrainTileId = this.layer['_getTileId'](x, y, z);
        }
        const terrainData = this.tilesInView[terrainTileId] || this.tileCache.get(terrainTileId);
        if (!terrainData && z - 1 >= limit) {
            return this._findTerrainData(null, Math.floor(x / 2), Math.floor(y / 2), z - 1, limit);
        }
        return terrainData;
    }

    _queryAltitudeInHeights(terrainData, x, y) {
        const { width, height, data } = terrainData;
        // 减一是因为width索引范围是从0到width-1
        const tx = Math.floor((width - 1) * x);
        // 减一是因为height索引范围是从0到height-1
        const ty = Math.floor((height - 1) * y);
        const index = ty * width + tx;
        if (data[index] === undefined) {
            return null;
        }
        return data[index];
    }

    _queryTileAltitude(out, extent, targetRes) {
        if (!out) {
            out = {
                tiles: {},
                dirty: true,
                complete: false
            };
        }
        const layer = this.layer;

        const z = this.getCurrentTileZoom();
        const sp = layer.getSpatialReference();
        const res = sp.getResolution(z);
        const { xmin, ymin, xmax, ymax } = extent;

        const config = layer['_getTileConfig']();

        POINT0.set(xmin, ymin)._multi(targetRes);
        const minIndex = config['_getTileNum'](POINT0, targetRes, true);
        POINT1.set(xmax, ymax)._multi(targetRes);
        const maxIndex = config['_getTileNum'](POINT1, targetRes, true);

        const txmin = Math.min(minIndex.x, maxIndex.x);
        const txmax = Math.max(minIndex.x, maxIndex.x);

        const tymin = Math.min(minIndex.y, maxIndex.y);
        const tymax = Math.max(minIndex.y, maxIndex.y);

        const scale = targetRes / res;
        POINT0.set(xmin, ymin)._multi(scale);
        POINT1.set(xmax, ymax)._multi(scale);
        const extent2d = TEMP_EXTENT.set(POINT0.x, POINT0.y, POINT1.x, POINT1.y);

        // martini 需要一点多余的数据
        const terrainSize = (layer.options['tileSize'] || 256) + 1;
        // 扩大一个像素
        extent2d._expand(extent2d.getWidth() / terrainSize);
        out.array = out.array || new Float32Array(terrainSize * terrainSize);
        const tiles = out.tiles;
        out.complete = true;
        out.array.fill(0);
        for (let i = txmin; i <= txmax; i++) {
            for (let j = tymin; j <= tymax; j++) {
                const tileId = this.layer['_getTileId'](i, j, z);
                if (tiles[tileId]) {
                    continue;
                }
                const terrainData = this.tileCache.get(tileId);
                // 如果当前瓦片找不到，则查询父级瓦片
                if (terrainData) {
                    this._fillAltitudeData(out.array, terrainData, extent2d, terrainSize);
                    out.dirty = true;
                    tiles[tileId] = 1;
                } else {
                    out.dirty = out.dirty || out.tiles[tileId] !== undefined;
                    if (out.tiles[tileId]) {
                        delete out.tiles[tileId];
                    }
                    out.complete = false;
                }
            }
        }
        return out;
    }

    _fillAltitudeData(out, terrainData, extent2d, terrainSize) {
        const terrainExtent = terrainData.info.extent2d;
        const intersection = terrainExtent.intersection(extent2d);
        const { xmin, ymin, xmax, ymax } = intersection;

        const { data: terrain } = terrainData.image;
        const width = terrain.width;
        const unit = extent2d.getWidth() / terrainSize;

        const xstart = Math.floor((xmin - extent2d.xmin) / unit);
        const ystart = Math.floor((ymin - extent2d.ymin) / unit);
        const xend = Math.floor((xmax - extent2d.xmin) / unit);
        const yend = Math.floor((ymax - extent2d.ymin) / unit);

        const xspan = xend - xstart;
        const yspan = yend - ystart;

        const tunit = terrainExtent.getWidth() / width;
        const tstartx = Math.floor((xmin - terrainExtent.xmin) / tunit);
        const tstarty = Math.floor((ymin - terrainExtent.ymin) / tunit);

        const stride = Math.floor(unit / tunit);

        for (let i = 0; i <= xspan; i++) {
            for (let j = 0; j <= yspan; j++) {
                const index = i + xstart + (ystart + j) * terrainSize;
                let height = 0;
                for (let k = 0; k < stride; k++) {
                    for (let kk = 0; kk < stride; kk++) {
                        // const terrainIndex = tstartx + Math.floor(i * stride) + k + (tstarty + Math.floor(j * stride)) * width + kk;
                        const terrainIndex = (tstartx + Math.floor(i * stride)) * width + k + tstarty + Math.floor(j * stride) + kk;
                        height += terrain.data[terrainIndex];
                    }
                }
                out[index] = height / Math.max(stride, 1);
                // if (isNaN(out[index])) {
                //     debugger
                // }
            }
        }
        return out;
    }

    onAdd() {
        super.onAdd();
        this.prepareWorker();
    }

    onRemove() {
        if (this.workerConn) {
            this.workerConn.removeLayer(this.layer.getId(), err => {
                if (err) throw err;
            });
            this.workerConn.remove();
            delete this.workerConn;
        }
        if (this._skinShader) {
            this._skinShader.dispose();
            delete this._skinShader;
        }
        if (this._skinGeometry) {
            this._skinGeometry.dispose();
            delete this._skinGeometry;
        }
        if (this._painter) {
            this._painter.delete();
            delete this._painter;
        }
        super.onRemove();
    }

    prepareWorker() {
        const map = this.layer.getMap();
        if (!this.workerConn) {
            this.workerConn = new TerrainWorkerConnection(map.id);
        }
        const workerConn = this.workerConn;
        if (!workerConn.isActive()) {
            return;
        }
        const options = this.layer.options || {};
        const id = this.layer.getId();
        workerConn.addLayer(id, options, err => {
            if (err) throw err;
            if (!this.layer) return;
            this.ready = true;
            this.setToRedraw();
            this.layer.fire('workerready');
        });
    }

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            this._createREGLContext();
        }
        this.renderer = new reshader.Renderer(this.regl);
    }

    _createPainter() {
        const painter = this._painter;
        if (this.layer.options.shader === 'lit') {
            if (painter && painter.constructor === TerrainPainter || !painter) {
                if (painter) {
                    painter.delete();
                    this.clear();
                    this.setToRedraw();
                }
                this._painter = new TerrainLitPainter(this.layer);
                this.layer.fire('paintercreated');
            }

        } else {
            if (painter && painter.constructor === TerrainLitPainter || !painter) {
                if (painter) {
                    painter.delete();
                    this.clear();
                    this.setToRedraw();
                }
                this._painter = new TerrainPainter(this.layer);
                this.layer.fire('paintercreated');
            }
        }
    }

    _createREGLContext() {
        const layer = this.layer;

        const attributes = layer.options.glOptions || {
            alpha: true,
            depth: true,
            antialias: this.layer.options['antialias']
            // premultipliedAlpha : false
        };
        attributes.preserveDrawingBuffer = true;
        attributes.stencil = true;
        this.glOptions = attributes;
        this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        // console.log(this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS));
        this.regl = createREGL({
            gl: this.gl,
            attributes,
            extensions: [
                'OES_element_index_uint'
            ],
            optionalExtensions: layer.options['glExtensions']
        });
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) { }
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        super.resizeCanvas(canvasSize);

    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }
        super.clearCanvas();

    }

    _initSkinShader() {
        if (this._skinShader) {
            return;
        }

        const tileSize = this.layer.getTileSize().width;
        this._skinShader = new reshader.MeshShader({
            vert: skinVert,
            frag: skinFrag,
            extraCommandProps: {
                cull: {
                    enable: false
                },
                viewport: {
                    x: 0,
                    y: 0,
                    width: tileSize * 2,
                    height: tileSize * 2
                },
                depth: {
                    enable: false
                },
                stencil: {
                    enable: false
                },
                blend: {
                    enable: true,
                    func: { src: 'one', dst: 'one minus src alpha' },
                    equation: 'add'
                }
            }
        });

        const aPosition = new Int8Array([
            -1, -1,
            1, 1,
            -1, 1,

            1, 1,
            -1, -1,
            1, -1
        ]);
        this._skinGeometry = this._skinGeometry || new reshader.Geometry({
            aPosition
        }, 0, 6, { positionSize: 2 });
        this._skinGeometry.generateBuffers(this.regl);
        this._skinScene = this._skinScene || new reshader.Scene();
    }

}

export default TerrainLayerRenderer;

const SKIN_LEVEL_LIMIT = 1;

maptalks.renderer.TileLayerCanvasRenderer.include({
    renderTerrainSkin(regl, terrainLayer, skinImages) {
        const tileSize = this.layer.getTileSize().width;
        const debug = terrainLayer.options['debug'];
        for (let i = 0; i < skinImages.length; i++) {
            const { tile, texture } = skinImages[i];
            if (!tile.image) {
                continue;
            }
            const canvas = document.createElement('canvas');
            skinImages[i].canvas = canvas;
            canvas.width = tileSize;
            canvas.height = tileSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(tile.image, 0, 0);
            if (debug) {
                const { x, y, z } = tile.info;
                drawDebug(ctx, `${x}/${y}/${z}`, 'yellow', 1, 0, 0, tileSize, tileSize, -18);
            }
            texture({
                data: canvas,
                width: tileSize,
                height: tileSize,
                flipY: true,
                min: 'linear',
                mag: 'linear'
            });
        }
    },

    createTerrainTexture(regl) {
        const tileSize = this.layer.getTileSize().width;
        const config = {
            width: tileSize,
            height: tileSize,
            flipY: true,
            min: 'linear',
            mag: 'linear',
            depthStencil: false,
            depth: false,
            stencil: false
        };
        return regl.texture(config);
    },

    deleteTerrainTexture(texture) {
        texture.destroy();
    }
});


// function drawTileImage(ctx, extent, terrainOffset, tile, res, debug) {
//     const scale = tile.info.res / res;
//     const { info, image } = tile;
//     const offset = info.offset;
//     const width = image.width * scale;
//     const height = image.height * scale;
//     const xmin = info.extent2d.xmin * scale;
//     const ymax = info.extent2d.ymax * scale;
//     const left = xmin - extent.xmin;
//     const top = extent.ymax - ymax;
//     const dx = terrainOffset[0] - offset[0];
//     const dy = offset[1] - terrainOffset[1];
//     ctx.drawImage(image, left + dx, top + dy, width, height);
//     if (debug) {
//         const { x, y, z } = tile.info;
//         drawDebug(ctx, `${x}/${y}/${z}`, 'yellow', 1, left + dx, top + dy, width, height, -18);
//     }
// }

function drawDebug(ctx, debugInfo, color, lineWidth, left, top, width, height, textOffsetY = 0) {
    ctx.font = '20px monospace';
    ctx.fillStyle = color;
    DEBUG_POINT.y = height - 30;
    ctx.globalAlpha = 1;
    ctx.fillText(debugInfo, DEBUG_POINT.x + left, DEBUG_POINT.y + top + textOffsetY);
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left + width, top);
    ctx.lineTo(left + width, top + height);
    ctx.lineTo(left, top + height);
    ctx.lineTo(left, top);
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function computeSkinDimension(terrainTileInfo, tile, terrainTileSize) {
    const { res, extent2d: extent, offset: terrainOffset } = terrainTileInfo;
    const { info } = tile;
    const scale = info.res / res;
    const offset = info.offset;
    const xmin = info.extent2d.xmin * scale;
    const ymin = info.extent2d.ymin * scale;
    const dx = terrainOffset[0] - offset[0];
    const dy = offset[1] - terrainOffset[1];
    const left = xmin - extent.xmin + dx;
    const bottom = extent.ymin - ymin + dy;
    return [left, -bottom, scale * terrainTileSize / info.tileSize];
}
