import * as maptalks from 'maptalks';
import TerrainWorkerConnection from './TerrainWorkerConnection';
import { createREGL } from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';
import skinVert from './glsl/terrainSkin.vert';
import skinFrag from './glsl/terrainSkin.frag';
import { getCascadeTileIds, getSkinTileScale, getSkinTileRes, createEmtpyTerrainHeights, EMPTY_TERRAIN_GEO } from './TerrainTileUtil';
import { createMartiniData } from './util/martini';
import { isNil, extend, pushIn } from '../util/util';
import TerrainPainter from './TerrainPainter';
import TerrainLitPainter from './TerrainLitPainter';
import MaskRendererMixin from '../mask/MaskRendererMixin';
import LRUPool from './LRUPool';

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

function terrainExaggeration(terrainData, exaggeration = 1) {
    if (isNil(exaggeration) || !terrainData || !terrainData.mesh || exaggeration === 1) {
        return;
    }
    const positions = terrainData.mesh.positions;
    if (!positions) {
        return;
    }
    for (let i = 0, len = positions.length; i < len; i += 3) {
        positions[i + 2] *= exaggeration;
    }
}



class TerrainLayerRenderer extends MaskRendererMixin(maptalks.renderer.TileLayerCanvasRenderer) {

    isDrawable() {
        return true;
    }

    getTempTileOnLoading(tileInfo, tile) {
        if (tile.image && !tile.image.reset) {
            return tile;
        }
        const tempTerrain = this._createTerrainFromParent(tileInfo);
        tempTerrain.temp = true;
        if (!tile.image) {
            tile.image = tempTerrain;
        }
        delete tile.image.reset;
        tile.current = true;
        tile.info = tileInfo;
        extend(tile.image, tempTerrain);
        this._createMesh(tile.image, tileInfo);
        return tile;
    }

    _resetTerrainImage(info, image, skinImagesToDel) {
        image.reset = true;
        delete image.data;
        delete image.loadTime;
        delete image.rendered;
        delete image.minAltitude;
        const refKey = info.id + '-temp';

        const skinImages = image.skinImages;
        if (skinImages) {
            for (let i = 0; i < skinImages.length; i++) {
                const cachedImages = skinImages[i];
                if (!cachedImages) {
                    continue;
                }
                for (let ii = 0; ii < cachedImages.length; ii++) {
                    const cached = cachedImages[ii];
                    if (!cached) {
                        continue;
                    }
                    cached.refs.delete(refKey);
                    if (!cached.refs.size) {
                        skinImagesToDel.push(cached);
                    }
                }
                delete cachedImages.currentSkins;
                delete cachedImages.tileIds;
            }
        }
        delete image.sourceZoom;
        delete image.skinImages;
        delete image.skinStatus;
        delete image.skinTileIds;
        if (image.debugTexture) {
            // need to rewrite debug text
            image.debugTexture.destroy();
            delete image.debugTexture;
        }
    }

    _createTerrainFromParent(tile, parentTile) {
        parentTile = parentTile || this.findParentTile(tile);
        while (parentTile && parentTile.image && (parentTile.image.sourceZoom === -1 || parentTile.image.originalError)) {
            parentTile = this.findParentTile(parentTile.info);
        }
        const res = (parentTile && parentTile.info || tile).res;
        const error = this.getMap().pointAtResToDistance(1, 1, res);
        const heights = parentTile && parentTile.image && parentTile.image.data && this._clipParentTerrain(parentTile, tile);
        const sourceZoom = heights && parentTile.image.sourceZoom !== -1 ? parentTile.info.z : -1;
        if (!heights || heights.width <= 1) {
            // find sibling tile's minAltitude
            const minAltitude = this._findTileMinAltitude(tile, parentTile);
            return { data: createEmtpyTerrainHeights(minAltitude || 0, 5), minAltitude, mesh: EMPTY_TERRAIN_GEO, sourceZoom };
        }
        const terrainWidth = heights.width;
        const mesh = createMartiniData(error, heights.data, terrainWidth, true);

        return { data: heights, mesh, sourceZoom };
    }

    _findTileMinAltitude(tile, parentTile) {
        if (parentTile && parentTile.minAltitude) {
            return parentTile.minAltitude;
        }
        const { idx, idy, z } = tile;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) {
                    continue;
                }
                const id = this.layer.getTileId(idx + i, idy + j, z);
                const info = this.layer.tileInfoCache.get(id);
                if (info && info.minAltitude) {
                    return info.minAltitude;
                }
            }
        }
        return 0;
    }

    consumeTile(tileImage, tileInfo) {
        if (tileImage.empty && !tileImage.mesh) {
            const parentTile = this.findParentTile(tileInfo);
            if (!parentTile || parentTile.image && parentTile.image.empty) {
                tileImage.mesh = EMPTY_TERRAIN_GEO;
                const minAltitude = this._findTileMinAltitude(tileInfo);
                tileImage.data = createEmtpyTerrainHeights(minAltitude || 0, 5);
                tileImage.minAltitude = minAltitude;
                tileImage.sourceZoom = -1;
            } else {
                tileImage = this._createTerrainFromParent(tileInfo, parentTile);
            }
        }
        this._createMesh(tileImage, tileInfo);
        super.consumeTile(tileImage, tileInfo);
        this._recenterMapOnTerrain(tileInfo);
    }

    _createMesh(tileImage, tileInfo) {
        if (tileImage && tileImage.mesh) {
            // console.log(tileImage,tileInfo);
            tileImage.terrainMesh = this._painter.createTerrainMesh(tileInfo, tileImage);
            tileInfo.minAltitude = tileImage.data.min;
            tileInfo.maxAltitude = tileImage.data.max;
            delete tileImage.mesh;
            const tileInfoCache = this.layer.tileInfoCache;
            if (tileInfoCache && tileInfo.parent && !tileImage.empty && !tileImage.temp) {
                const parentNode = tileInfoCache.get(tileInfo.parent);
                if (parentNode) {
                    const { minAltitude, maxAltitude } = tileInfo;
                    if (parentNode.minAltitude === undefined || parentNode.minAltitude > minAltitude) {
                        parentNode.minAltitude = minAltitude;
                    }
                    if (parentNode.maxAltitude === undefined || parentNode.maxAltitude < maxAltitude) {
                        parentNode.maxAltitude = maxAltitude;
                    }
                }
            }
        }
    }

    _recenterMapOnTerrain(tileInfo) {
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
        this._painter.startFrame(parentContext);
        super.draw(timestamp, parentContext);
        this._endFrame(parentContext);
    }

    drawTile(tileInfo, tileImage) {
        const map = this.getMap();
        if (!tileInfo || !map || !tileImage) {
            return;
        }
        if (!this.drawingCurrentTiles && !this.drawingChildTiles) {
            return;
        }
        let opacity = this.drawingCurrentTiles ? this.getTileOpacity(tileImage) : 1;
        opacity *= (this.layer.options.opacity || 1);
        this._painter.addTerrainImage(tileInfo, tileImage, opacity);
    }

    _drawTiles(tiles, parentTiles, childTiles, placeholders, context, missedTiles, incompleteTiles) {
        const skinImagesToDel = [];

        //TODO tiles中如果存在empty瓦片，且sourceZoom精度不够的，可以重新切分精度更高的数据
        const tempTiles = this._getTempTilesForMissed(missedTiles, skinImagesToDel);
        // this._tempTilesPool.shrink();
        this._newTerrainTileCounter = 0;
        const skinCount = this.layer.getSkinCount();
        pushIn(tiles, tempTiles);
        const visitedSkinTiles = new Set();
        // 集中对每个SkinLayer调用renderTerrainSkin，减少 program 的切换开销
        for (let i = 0; i < skinCount; i++) {
            this._renderChildTerrainSkin(i, incompleteTiles, visitedSkinTiles, skinImagesToDel);
        }
        for (let i = 0; i < skinCount; i++) {
            this._renderChildTerrainSkin(i, tiles, visitedSkinTiles, skinImagesToDel);
        }

        for (let i = 0; i < tiles.length; i++) {
            this._renderTerrainMeshSkin(tiles[i].info, tiles[i].image);
        }

        for (let i = 0; i < skinImagesToDel.length; i++) {
            if (skinImagesToDel[i]) {
                if (skinImagesToDel[i].texture && !skinImagesToDel[i].refs.size) {
                    this._skinImageCache.delete(skinImagesToDel[i].tile.id);
                    this._deleteSkinImage(skinImagesToDel[i]);
                }
            }
        }

        this._clearCachdeSkinImages();
        return super._drawTiles(...arguments);
    }

    _getTempTilesForMissed(missedTiles, skinImagesToDel) {
        const tempTiles = [];
        let pool = this._tempTilesPool;
        if (!pool) {
            pool = this._tempTilesPool = new LRUPool(this.layer.options['tempTileCacheSize'], tile => {
                const { info, image } = tile;
                this._deleteTerrainImage(info, image);
            });
        }
        pool.resetCurrent(false);

        for (let i = 0; i < missedTiles.length; i++) {
            const tileInfo = missedTiles[i];
            let tile;
            if (pool.has(tileInfo.id)) {
                tile = pool.getAndRemove(tileInfo.id);
            } else {
                tile = pool.pop();
                if (!tile) {
                    tile = { info: tileInfo };
                } else if (tile.image) {
                    this._resetTerrainImage(tile.info, tile.image, skinImagesToDel);
                    tile.image.temp = true;
                }
            }
            tile.current = true;
            pool.add(tileInfo.id, tile);
            tempTiles.push(tile);
        }

        for (let i = 0; i < missedTiles.length; i++) {
            this.getTempTileOnLoading(missedTiles[i], tempTiles[i]);
        }
        return tempTiles;
    }

    _clearCachdeSkinImages() {
        if (!this._skinImageCache) {
            return;
        }
        // 每十秒对skinImageCache做一次统一的排查回收，将没人引用的图片删除掉
        // 虽然流程中尽量做了删除，但skinImageCache中仍会出现没人引用的冗余image对象
        // 因为排查困难，且未来的逻辑修改可能会带来新的内存泄露，采用该机制至少能彻底防止skinImageCache中的
        const currentTimestamp = this.getCurrentTimestamp();
        if (this._clearSkinImageTimestamp && currentTimestamp - this._clearSkinImageTimestamp < 1000) {
            return;
        }
        const currentImages = new Set();
        for (const tile of this.tileCache.data.values()) {
            this._collectSkinImages(tile, currentImages);
        }

        for (const p in this.tilesInView) {
            const tile = this.tilesInView[p];
            this._collectSkinImages(tile, currentImages);
        }

        if (this._tempTilesPool) {
            for (const tile of this._tempTilesPool.data.values()) {
                this._collectSkinImages(tile, currentImages);
            }
        }

        if (!currentImages.size) {
            return;
        }

        this._skinImageCache.forEach((v, id) => {
            if (!currentImages.has(id)) {
                console.log('deleted:', id);
                this._deleteSkinImage(this._skinImageCache.get(id));
                this._skinImageCache.delete(id);
            }
        });
        this._clearSkinImageTimestamp = currentTimestamp;
    }

    _collectSkinImages(tile, currentImages) {
        const skinImages = tile.image && tile.image.skinImages;
        if (!skinImages || !skinImages.length) {
            return;
        }
        for (let i = 0; i < skinImages.length; i++) {
            const currentSkins = skinImages[i] && skinImages.currentSkins;
            if (currentSkins) {
                for (const tileId of currentSkins) {
                    currentImages.add(tileId);
                }
            }
        }

    }

    _renderChildTerrainSkin(skinIndex, terrainTiles, visitedSkinTiles, skinImagesToDel) {
        const skinLayer = this.layer.getSkinLayer(skinIndex);
        const renderer = skinLayer.getRenderer();
        if (!renderer) {
            return;
        }
        const layerSkinImages = [];
        for (let i = 0; i < terrainTiles.length; i++) {
            const { info, image } = terrainTiles[i];
            if (this._prepareChildTerrainSkin(skinIndex, info, image, skinImagesToDel)) {
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
        // render terrain skin of skin layer
        renderer.renderTerrainSkin(this.regl, this.layer, layerSkinImages);
    }

    _prepareChildTerrainSkin(skinIndex, terrainTileInfo, tileImage, skinImagesToDel) {
        const map = this.getMap();
        delete tileImage.path;
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
            // if (map.isInteracting()) {
            //     const limit = this.layer.options['newTerrainTileRenderLimitPerFrameOnInteracting'];
            //     if (limit > 0 && this._newTerrainTileCounter > limit) {
            //         return false;
            //     }
            // }
            tileImage.skinImages = [];
        }
        if (!tileImage.skinStatus) {
            tileImage.skinStatus = [];
        }
        if (!tileImage.skinTileIds) {
            tileImage.skinTileIds = [];
        }

        const isAnimating = renderer.isAnimating && renderer.isAnimating();

        const status = tileImage.skinStatus[skinIndex];

        const isLayerAskToRefresh = renderer.needToRefreshTerrainTileOnZooming && renderer.needToRefreshTerrainTileOnZooming();
        const needRefreshTerrainTile = isAnimating || isLayerAskToRefresh && tileImage.renderedZoom !== map.getZoom();
        if (status && !needRefreshTerrainTile) {
            return false;
        }
        const sr = skinLayer.getSpatialReference();
        const { x, y, z, res, offset } = terrainTileInfo;
        let nw = terrainTileInfo.nw;
        if (!nw) {
            nw = terrainTileInfo.nw = this.getMap().pointAtResToCoord(terrainTileInfo.extent2d.getMin(POINT0), terrainTileInfo.res);
        }
        const tileSize = this.layer.getTileSize().width;
        // const zoom = this.getCurrentTileZoom();
        const { res: myRes, zoom } = getSkinTileRes(sr, z, res);

        const myTileSize = skinLayer.getTileSize().width;

        const scale = getSkinTileScale(myRes, myTileSize, res, tileSize);

        let skinTileIds = tileImage.skinTileIds[skinIndex];
        if (!skinTileIds) {
            const terrainTileScaleY = this.layer['_getTileConfig']().tileSystem.scale.y;
            skinTileIds = tileImage.skinTileIds[skinIndex] = getCascadeTileIds(skinLayer, x, y, zoom, nw, offset, terrainTileScaleY, scale, SKIN_LEVEL_LIMIT);
        }
        const level0 = skinTileIds['0'];
        let complete = true;
        const tiles = [];
        for (let i = 0; i < level0.length; i++) {
            const cachedTile = renderer.getCachedTile(level0[i], false);
            if (!cachedTile) {
                complete = false;
                const parentTile = renderer.findParentTile(level0[i]);
                if (parentTile) {
                    tiles.push(parentTile);
                }
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

        const skinImages = tileImage.skinImages[skinIndex] || [];
        skinImages.currentSkins = skinImages.currentSkins || new Set();
        const prevSkins = new Set();
        let skinImageRetired = false;
        for (let i = 0; i < skinImages.length; i++) {
            if (!skinImages[i].tile) {
                skinImageRetired = true;
                continue;
            }
            const id = skinImages[i].tile.info.id;
            prevSkins.add(id);
        }
        if (!tiles.length) {
            skinImages.currentSkins.clear();
            tileImage.skinImages[skinIndex] = [];
            // this._clearPrevSkinImages(terrainTileInfo, tileImage, prevSkins, null, skinImagesToDel);
            return false;
        }

        const ids = tiles.length ? tiles.map(t => t.info.id).join() : tiles[0].info.id;
        if (!needRefreshTerrainTile && !skinImageRetired && skinImages.tileIds === ids) {
            return false;
        }
        skinImages.tileIds = ids;
        let updated = false;
        // if (skinImages.length < tiles.length) {
        skinImages.currentSkins.clear();
        skinImages.length = 0;
        const currentSkins = skinImages.currentSkins;
        let refKey = terrainTileInfo.id;
        if (tileImage.temp) {
            refKey += '-temp';
        }

        // 为每个 skin tile 创建一个 skin texture
        // 当 skin tile 范围比 terrain tile 更大时，每个 skin tile 只需绘制一次
        for (let i = 0; i < tiles.length; i++) {
            const tileId = tiles[i].info.id;
            currentSkins.add(tileId);
            let cached = this._getCachedSkinImage(tileId);
            if (!cached || !isValidSkinImage(cached)) {
                cached = {
                    tile: extend({}, tiles[i]),
                    layer: skinLayer,
                    refs: new Set(),
                    texture: renderer.createTerrainTexture(this.regl)
                };
                this._saveCachedSkinImage(tileId, cached);
            }
            cached.refs.add(refKey);
            skinImages.push(cached);
            updated = true;
        }

        this._clearPrevSkinImages(terrainTileInfo, tileImage, prevSkins, currentSkins, skinImagesToDel);

        // }
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

    _clearPrevSkinImages(terrainTileInfo, tileImage, prevSkins, currentSkins, skinImagesToDel) {
        if (!prevSkins.size) {
            return;
        }
        let refKey = terrainTileInfo.id;
        if (tileImage.temp) {
            refKey += '-temp';
        }
        for (const tileId of prevSkins) {
            if (!currentSkins || !currentSkins.has(tileId)) {
                const cached = this._getCachedSkinImage(tileId);
                this._deleteCachedSkinImage(cached, refKey, skinImagesToDel);
            }
        }
    }

    _getCachedSkinImage(id) {
        if (!this._skinImageCache) {
            this._skinImageCache = new Map();
        }
        return this._skinImageCache.get(id);
    }

    _saveCachedSkinImage(id, cached) {
        // console.log(this._skinImageCache.size);
        this._skinImageCache.set(id, cached);
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
        const needRefreshSkins = this._needRefreshTerrainSkins(tileImage.renderedZoom);
        if (tileImage.rendered && !needRefreshSkins) {
            return;
        }
        if (!tileImage.skin) {
            tileImage.skin = this._createTerrainTexture(terrainTileInfo, tileImage);

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
                    const { tile, texture, layer } = layerSkinImages[ii];
                    const hasOffset = (tile.info.offset[0] || tile.info.offset[1]);
                    if (hasOffset && terrainTileInfo.skinTileIds) {
                        const skinTileIds = terrainTileInfo.skinTileIds[layer.getId()];
                        for (let j = 0; j < skinTileIds.length; j++) {
                            if (tile.info.x === skinTileIds[j].x && tile.info.y === skinTileIds[j].y) {
                                tile.info.offset = skinTileIds[j].offset;
                                break;
                            }
                        }

                    }
                    const skinDim = computeSkinDimension(terrainTileInfo, tile, tileSize);
                    const mesh = layerSkinImages[ii].skinMesh || new reshader.Mesh(this._skinGeometry);
                    mesh.setUniform('skinTexture', texture);
                    const skinTileOpacity = layer.getOpacity();
                    mesh.setUniform('opacity', isNil(skinTileOpacity) ? 1 : skinTileOpacity);
                    mesh.setUniform('skinDim', skinDim);
                    mesh.setUniform('tileSize', tileSize);
                    mesh.setUniform('x', terrainTileInfo.x);
                    mesh.setUniform('y', terrainTileInfo.y);
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
            debugMesh.setUniform('opacity', 1);
            debugMesh.setUniform('skinTexture', debugTexture);
            debugMesh.setUniform('skinDim', [0, 0, 1]);
            debugMesh.setUniform('tileSize', tileSize);
            debugMeshes.push(debugMesh);
        }
        if (meshes.length) {
            this._skinScene.setMeshes(meshes);
            try {
                this.renderer.render(this._skinShader, null, this._skinScene, tileImage.skin);
            } catch (err) {
                console.error(tileImage);
                throw err;
            }

        }

        if (debugMeshes && debugMeshes.length && this.layer.options.debug) {
            this._skinScene.setMeshes(debugMeshes);
            this.renderer.render(this._skinShader, null, this._skinScene, tileImage.skin);
        }

        tileImage.rendered = this._isSkinReady(tileImage);
        tileImage.renderedZoom = map.getZoom();
    }

    _createDebugTexture(tileInfo, tileSize) {
        tileSize *= 2;

        const { x, y, z } = tileInfo;
        const debugInfo = `terrain:${x}/${y}/${z}`;

        const canvas = document.createElement('canvas');
        canvas.width = tileSize;
        canvas.height = tileSize;
        const ctx = canvas.getContext('2d');
        ctx.font = '20px monospace';

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

    _createTerrainTexture(tileInfo/*, tileImage*/) {
        const tileSize = this.layer.getTileSize().width;
        // 乘以2是为了瓦片（缩放时）被放大后保持清晰度
        const width = tileSize * 2;
        const height = tileSize * 2;
        const regl = this.regl;
        const colorsTexture = tileInfo.colorsTexture;
        let color;
        if (colorsTexture && colorsTexture instanceof Uint8Array) {
            color = regl.texture({
                data: colorsTexture,
                min: 'linear',
                mag: 'linear',
                type: 'uint8',
                width,
                height,
                flipY: true
            });
        } else {
            color = regl.texture({
                min: 'linear',
                mag: 'linear',
                type: 'uint8',
                width,
                height,
                flipY: true
            });
        }
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

    _clipParentTerrain(parentTile, tile) {
        const { image, info } = parentTile;
        const terrainData = image.data;
        const terrainWidth = terrainData.width;
        const { extent2d: parentExtent, res: parentRes } = info;
        const { extent2d, res } = tile;
        const width = parentExtent.getWidth();
        const height = parentExtent.getHeight();
        let xmin = (extent2d.xmin * res / parentRes - parentExtent.xmin) / width * (terrainWidth - 1);
        let ymin = (parentExtent.ymax - extent2d.ymax * res / parentRes) / height * (terrainWidth - 1);
        const xmax = (extent2d.xmax * res / parentRes - parentExtent.xmin) / width * (terrainWidth - 1);

        let tileWidth = Math.round(xmax - xmin);
        const log = Math.log2(tileWidth);
        tileWidth = Math.pow(2, Math.round(log)) + 1;
        xmin = Math.floor(xmin);
        ymin = Math.floor(ymin);

        // const tileSize = tileWidth - 1;
        // if (tileSize & (tileSize - 1)) {
        //     debugger
        // }
        // 先行再列
        const heights = new Float32Array(tileWidth * tileWidth);
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < tileWidth; i++) {
            for (let j = 0; j < tileWidth; j++) {
                let x = i + xmin;
                let y = j + ymin;
                if (x > terrainWidth - 1) {
                    x = terrainWidth - 1;
                } else if (x < 0) {
                    x = 0;
                }
                if (y > terrainWidth - 1) {
                    y = terrainWidth - 1;
                } else if (y < 0) {
                    y = 0;
                }
                const height = terrainData.data[x + y * terrainWidth];
                // if (height === undefined) {
                //     debugger
                // }
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

    _needRefreshTerrainSkins(renderedZoom) {
        // 只在有缩放地图，或者layer有动画时，才重绘skin
        const zoom = this.getMap().getZoom();
        const skinLayers = this.layer.getSkinLayers();
        for (let i = 0; i < skinLayers.length; i++) {
            const renderer = skinLayers[i] && skinLayers[i].getRenderer();
            if (!renderer) {
                continue;
            }
            if (renderer.isAnimating && renderer.isAnimating()) {
                return true;
            }
            if (renderer.needToRefreshTerrainTileOnZooming && renderer.needToRefreshTerrainTileOnZooming() && renderedZoom !== zoom) {
                return true;
            }
        }
        return false;
    }

    isValidCachedTile(tile) {
        // parent或者child tile没有初始化时，也允许加到parentsTile里，执行初始化逻辑
        const notInitialized = !tile.image.skinStatus;
        return tile.image && !tile.image.temp && (notInitialized || this._isSkinReady(tile.image));
    }

    isTileComplete(tile) {
        return tile.image && !tile.image.temp && this._isSkinReady(tile.image);
    }

    _getTerrainWidth() {
        const layerOptions = this.layer.options;
        return isNil(layerOptions.terrainWidth) ? layerOptions.tileSize + 1 : layerOptions.terrainWidth;
    }

    _getParentTileRequest(tile, createIfNotExists) {
        const maxAvailableZoom = this.layer.options['maxAvailableZoom'] - this.layer.options['zoomOffset'];
        const diff = tile.z - maxAvailableZoom;
        const scale = Math.pow(2, diff);
        const x = Math.floor(tile.x / scale);
        const y = Math.floor(tile.y / scale);
        const idx = Math.floor(tile.idx / scale);
        const idy = Math.floor(tile.idy / scale);
        const reqKey = getParentRequestKey(x, y);
        if (!this._parentRequests) {
            this._parentRequests = {};
        }
        const isFirst = !this._parentRequests[reqKey];
        if (isFirst && createIfNotExists) {
            this._parentRequests[reqKey] = new Set();
            this._parentRequests[reqKey].url = this.layer.getTileUrl(x, y, maxAvailableZoom + this.layer.options['zoomOffset'])
        }
        return {
            x, y, idx, idy, requests: this._parentRequests[reqKey], isFirst, key: reqKey
        };
    }

    loadTile(tile) {
        const layer = this.layer;
        const terrainWidth = this._getTerrainWidth();
        const sp = layer.getSpatialReference();
        const res = sp.getResolution(tile.z);
        let error = this.getMap().pointAtResToDistance(1, 1, res);

        const zoomOffset = layer.options['zoomOffset'] || 0;
        const maxAvailableZoom = layer.options['maxAvailableZoom'] && (layer.options['maxAvailableZoom'] - zoomOffset);

        if (maxAvailableZoom && tile.z > maxAvailableZoom) {

            // 检查 maxAvailableZoom 的tile是否存在，如果没有存在，则请求它，并在返回结果后clip
            const terrainData = this._createTerrainFromParent(tile);
            if (terrainData.sourceZoom === -1) {
                //改为请求maxAvailableZoom上的瓦片
                const { requests, isFirst, x, y, idx, idy } = this._getParentTileRequest(tile, true);
                requests.add(tile);
                if (!isFirst) {
                    return terrainData;
                }
                const diff = tile.z - maxAvailableZoom;
                error = error * Math.pow(2, diff);
                const res = tile.res * Math.pow(2, diff);
                const args = [x, y, maxAvailableZoom, idx, idy, res, tile.error * Math.pow(2, diff)];
                tile = layer.createTileNode ? layer.createTileNode(...args) : layer._createTileNode(...args);
            } else {
                this.onTileLoad(terrainData, tile);
                return terrainData;
            }
        }

        const terrainUrl = tile.url;
        const terrainData = {};
        const layerOptions = layer.options;

        const tileSize = layer.getTileSize();

        const options = {
            terrainWidth,
            type: layerOptions.type,
            accessToken: layerOptions.accessToken,
            cesiumIonTokenURL: layerOptions.cesiumIonTokenURL,
            error: error,
            colors: layerOptions.colors,
            tileSize: tileSize ? [tileSize.width, tileSize.height] : [256, 256]
        };
        this.workerConn.fetchTerrain(terrainUrl, options, (err, resource) => {
            if (this._parentRequests) {
                const reqKey = getParentRequestKey(tile.x, tile.y);
                const childTiles = this._parentRequests[reqKey];
                if (childTiles && childTiles.size) {
                    this.tileCache.add(tile.id, { info: tile, image: terrainData });
                    for (const tile of childTiles) {
                        this.removeTileLoading(tile);
                    }
                }
                delete this._parentRequests[reqKey];
            }
            if (err) {
                if (err.canceled) {
                    return;
                }
                console.warn(err);
                this.onTileError(terrainData, tile);
                return;
            }
            maptalks.Util.extend(terrainData, resource);
            terrainExaggeration(terrainData, this.layer.options.exaggeration);

            // this.consumeTile(terrainData, tile);
            tile.colorsTexture = terrainData.colorsTexture;
            this.onTileLoad(terrainData, tile);
        });
        return terrainData;
    }

    deleteTile(tile) {
        if (!tile || !tile.image) {
            return;
        }
        super.deleteTile(tile);
        const { info, image } = tile;
        if (image.temp) {
            return;
        }
        delete info.skinTileIds;
        this._deleteTerrainImage(tile.info, image);
    }

    _deleteTerrainImage(tileInfo, image) {
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
            let refKey = tileInfo.id;
            if (image.temp) {
                refKey += '-temp';
            }
            for (let i = 0; i < skinImages.length; i++) {
                const layerSkinImages = skinImages[i];
                if (!layerSkinImages) {
                    continue;
                }
                for (let ii = 0; ii < layerSkinImages.length; ii++) {
                    if (!layerSkinImages[ii] || !layerSkinImages[ii].tile) {
                        continue;
                    }
                    const skinTileId = layerSkinImages[ii].tile.info.id;
                    const cached = this._skinImageCache && this._skinImageCache.get(skinTileId);
                    if (cached) {
                        this._deleteCachedSkinImage(cached, refKey);
                    }
                }
                layerSkinImages.length = 0;
            }
        }
        if (image.terrainMesh) {
            this._painter.deleteMesh(image.terrainMesh);
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
        delete image.mesh;
        delete image.rendered;
        // delete image.temp;
    }

    _deleteCachedSkinImage(cached, refKey, skinImagesToDel) {
        if (!cached) {
            return;
        }
        cached.refs.delete(refKey);
        if (!cached.refs.size) {
            if (skinImagesToDel) {
                skinImagesToDel.push(cached);
            } else {
                this._deleteSkinImage(cached);
            }
        }
    }

    _deleteSkinImage(cached) {
        if (!cached || !cached.tile) {
            return;
        }
        const skinTileId = cached.tile.info.id;
        const renderer = cached.layer.getRenderer();
        delete cached.canvas;
        delete cached.layer;
        cached.refs.clear();
        if (cached.texture) {
            if (!renderer) {
                if (cached.texture.destroy) {
                    cached.texture.destroy();
                }
            } else {
                renderer.deleteTerrainTexture(cached.texture);
            }
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
        delete cached.tile;
        this._skinImageCache.delete(skinTileId);
    }

    _clearSkinImageCache() {
        if (!this._skinImageCache) {
            return;
        }
        const keys = this._skinImageCache.keys();
        for (const id of keys) {
            const cached = this._getCachedSkinImage(id);
            this._deleteSkinImage(cached);
        }
        this._skinImageCache.clear();
    }

    abortTileLoading(tileImage, tileInfo) {
        const layer = this.layer;
        const maxAvailableZoom = layer.options.maxAvailableZoom && (layer.options.maxAvailableZoom - layer.options.zoomOffset);
        if (tileInfo) {
            if (maxAvailableZoom && tileInfo.z > maxAvailableZoom) {
                const { requests, key } = this._getParentTileRequest(tileInfo);
                if (requests && requests.size) {
                    requests.delete(tileInfo);
                    if (!requests.size) {
                        // 中止 maxAvailableZoom 瓦片的请求
                        delete this._parentRequests[key];
                        if (this.workerConn) {
                            this.workerConn.abortTerrain(requests.url);
                        }
                    }
                }
            } else {
                if (tileInfo && tileInfo.url) {
                    if (this.workerConn) {
                        this.workerConn.abortTerrain(tileInfo.url);
                    }
                }
            }
        }

        super.abortTileLoading(tileImage, tileInfo);
    }

    onTileError(data, tile) {
        // TODO
        super.onTileError(data, tile);
    }

    _getTerrainTileAtPrjCoord(prjCoord) {
        const zoom = this.getCurrentTileZoom();
        const sp = this.layer.getSpatialReference();
        const res = sp.getResolution(zoom);
        const tileIndex = this.layer['_getTileConfig']().getTileIndex(prjCoord, res, this.layer.options['repeatWorld']);
        tileIndex.z = zoom;
        return tileIndex;
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
        const terrainSize = layer.getTileSize().width + 1;
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

    clear() {
        this.clearTempResources();
        return super.clear();
    }

    clearTempResources() {
        if (this._tempTilesPool) {
            this._tempTilesPool.reset();
            delete this._tempTilesPool;
        }
        if (this._skinImageCache) {
            this._clearSkinImageCache();
        }
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
        this.clearTempResources();
        if (this._skinShader) {
            this._skinShader.dispose();
            delete this._skinShader;
        }
        if (this._skinGeometry) {
            this._skinGeometry.dispose();
            delete this._skinGeometry;
        }
        delete this._parentRequests;
        super.onRemove();
        if (this._painter) {
            this._painter.delete();
            delete this._painter;
        }
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
        this.layer.fire('contextcreate', { regl: this.regl });
    }

    _createPainter() {
        const painter = this._painter;
        if (this.layer.options.shader === 'lit' || this.layer.options.shader === 'pbr') {
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

    updateMaterial(mat) {
        if (!this._painter || !mat) {
            return;
        }
        if (!this._painter.updateMaterial) {
            return;
        }
        if (this._matVer === undefined) {
            this._matVer = 1;
        }
        this._painter.updateMaterial(mat, this._matVer++);
    }

    setMaterial(mat) {
        if (!this._painter || !mat) {
            return;
        }
        if (!this._painter.setMaterial) {
            return;
        }
        if (this._matVer === undefined) {
            this._matVer = 1;
        }
        this._painter.setMaterial(mat, this._matVer++);
    }

    getAnalysisMeshes() {
        if (this._painter && this._painter._leafScene) {
            return this._painter._leafScene.getMeshes();
        }
        return [];
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
                min: 'linear mipmap linear',
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
            min: 'linear mipmap linear',
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
    const { res, extent2d: terrainExtent, offset: terrainOffset } = terrainTileInfo;
    const { info } = tile;
    const scale = info.res / res;
    const offset = info.offset;
    const xmin = info.extent2d.xmin * scale;
    const ymin = info.extent2d.ymin * scale;
    const dx = terrainOffset[0] - offset[0];
    const dy = offset[1] - terrainOffset[1];
    const left = xmin - terrainExtent.xmin + dx;
    const bottom = terrainExtent.ymin - ymin + dy;
    return [left, -bottom, scale * info.tileSize / terrainTileSize];
}

function isValidSkinImage(image) {
    return image && image.texture;
}

function getParentRequestKey(x, y) {
    return x + '-' + y;
}
