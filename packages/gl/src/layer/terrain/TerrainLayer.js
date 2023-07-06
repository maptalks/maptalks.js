import * as maptalks from 'maptalks';
import TerrainLayerRenderer from './TerrainLayerRenderer';
import { getTileIdsAtLevel, getSkinTileScale, getSkinTileRes, getCascadeTileIds } from './TerrainTileUtil';
import  { extend } from '../util/util';

const COORD0 = new maptalks.Coordinate(0, 0);
const POINT0 = new maptalks.Point(0, 0);
const EMPTY_ARRAY = [];
const ALTITUDE = [];

const options = {
    'forceRenderOnMoving': true,
    'forceRenderOnZooming': true,
    'forceRenderOnRotating': true,
    'fadeDuration': (1000 / 60 * 15),
    'tileLimitPerFrame': 2,
    'newTerrainTileRenderLimitPerFrameOnInteracting': 1,
    'opacity': 1.0,
    'renderer': 'gl',
    'pyramidMode': 1,
    'tileSize': 512,
    'terrainWidth': 65,
    'backZoomOffset': 0,
    'depthMask': true,
    'blendSrc': 'one',
    'blendDst': 'one minus src alpha',
    'requireSkuToken': true,
    'tileRetryCount': 0,
    'maxCacheSize': 300,
    'shader': 'default'
};

const EMPTY_TILE_GRIDS = {
    tileGrids: [],
    count: 0
};


const SKU_ID = '01';
const TOKEN_VERSION = '1';
const base62chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// terrain 的渲染流程：
// 1. TerrainLayer 计算有哪些瓦片, terrainTiles
// 2. 每个skinLayer根据 terrainTiles 计算出自己需求请求哪些瓦片 skinTiles（需要注意多个terrainTile可能共享skinTile）
// 3. 遍历 skinTiles，为每个 skinTiles 创建必要的 skinTexture，并绘制 skinTiles 到 skinTexture 中，因为做过去重，每个skinTile只会绘制一次
// 4. 遍历 terrainTiles， 为每个 terrainTiles 创建 terrainMesh，并在frag shader中合成 skinTiles 的 skinTexture，最终绘制到地图场景中
export default class TerrainLayer extends maptalks.TileLayer {
    getTileUrl(x, y, z) {
        let terrainUrl = super.getTileUrl(x, y, z);
        const type = this.options.type;
        if (type === 'cesium') {
            z = z - 1;
            const yTiles = 1 << z;
            y =  yTiles - y - 1;
        }
        if (type === 'mapbox') {
            if (this.options['requireSkuToken']) {
                if (!this._skuToken) {
                    this._skuToken = this._createSkuToken();
                }
                if (terrainUrl.indexOf('?') > -1) {
                    terrainUrl += '&sku=' + this._skuToken;
                } else {
                    terrainUrl += '?sku=' + this._skuToken;
                }
            }
        } else if (type === 'cesium') {
            terrainUrl += '?extensions=octvertexnormals-watermask-metadata&v=1.2.0';
        }
        return terrainUrl;
    }

    _getTileZoom(zoom) {
        // 防止触发
        this['_isUpdatingOptions'] = true;
        const maxAvailableZoom = this.options['maxAvailableZoom'];
        // 忽略原有的 maxAvailableZoom 逻辑，改为如果zoom超过 maxAvailableZoom 则用父瓦片分割
        this.options['maxAvailableZoom'] = null;
        const tileZoom = super['_getTileZoom'](zoom);
        this.options['maxAvailableZoom'] = maxAvailableZoom;
        this['_isUpdatingOptions'] = false;
        return tileZoom;
    }

    _createSkuToken() {
        // https://github.com/mapbox/mapbox-gl-js/blob/6971327e188b9aa045622925a59800aa8ee940ac/src/util/sku_token.js
        let sessionRandomizer = '';
        for (let i = 0; i < 10; i++) {
            sessionRandomizer += base62chars[Math.floor(Math.random() * 62)];
        }
        const token = [TOKEN_VERSION, SKU_ID, sessionRandomizer].join('');
        return token;
    }

    setSkinLayers(skinLayers) {
        this._skinLayers = skinLayers;
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.clear();
            renderer.setToRedraw();
        }
    }

    getSkinTiles(layer) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return EMPTY_TILE_GRIDS;
        }
        const tileGrids = renderer.getTileGridsInCurrentFrame();
        const grid = tileGrids.tileGrids[0];
        if (!grid) {
            return EMPTY_TILE_GRIDS;
        }
        const layerId = layer.getId();
        const tileSysScale = this._getTileConfig().tileSystem.scale;
        const tileSize = layer.getTileSize().width;
        const tiles = grid.tiles;
        if (!tiles.length) {
            return EMPTY_TILE_GRIDS;
        }
        const parents = grid.parents || EMPTY_ARRAY;
        const parentCount = parents.length;
        const allTiles = parents.concat(tiles);

        const sr = layer.getSpatialReference();
        const size = tiles[0].extent2d.getWidth();

        const dx = tileSysScale.x;
        const dy = tileSysScale.y;

        const parentSkinTiles = [];
        const skinTiles = [];
        const allSkinTileIds = new Set();

        for (let i = 0; i < allTiles.length; i++) {
            const info = allTiles[i];
            const { res } = info;
            const { res: skinRes, zoom } = getSkinTileRes(sr, info.z, res);
            const resScale = skinRes / res;
            const scale = getSkinTileScale(skinRes, tileSize, res, size);

            const { extent2d, offset } = info;
            const leftX = scale * info.x;
            const topY = scale * info.y;
            if (!info.skinTileIds) {
                info.skinTileIds = {};
            }
            if (!info.skinTileIds[layerId]) {
                const skinTileIds = new Set();
                const layerTiles = [];
                const tileIds = getTileIdsAtLevel(layer, info.x, info.y, zoom, offset, scale, 0);
                for (let j = 0; j < tileIds.length; j++) {
                    const skinTile = tileIds[j];
                    if (skinTileIds.has(skinTile.id)) {
                        continue;
                    }
                    skinTile.idx = skinTile.x;
                    skinTile.idy = skinTile.y;
                    skinTile.res = skinRes;
                    skinTile.url = layer.getTileUrl(skinTile.x, skinTile.y, skinTile.z + layer.options['zoomOffset']);

                    const xOffset = dx * (skinTile.x - leftX) * tileSize;
                    const yOffset = dy * (skinTile.y - topY) * tileSize;
                    const xmin = extent2d.xmin * resScale + xOffset;
                    const ymax = extent2d.ymax * resScale + yOffset;
                    skinTile.extent2d = new maptalks.PointExtent(
                        xmin,
                        ymax - tileSize,
                        xmin + tileSize,
                        ymax,
                    );
                    skinTileIds.add(skinTile.id);
                    layerTiles.push(skinTile);
                }
                info.skinTileIds[layerId] = layerTiles;
            }
            const tileSkinTiles = info.skinTileIds[layerId];
            for (let j = 0; j < tileSkinTiles.length; j++ ){
                if (!allSkinTileIds.has(tileSkinTiles[j].id)) {
                    if (i < parentCount) {
                        parentSkinTiles.push(tileSkinTiles[j]);
                    } else {
                        skinTiles.push(tileSkinTiles[j]);
                    }
                    allSkinTileIds.add(tileSkinTiles[j].id);
                }
            }
        }
        return {
            tileGrids: [
                {
                    extent: grid.extent,
                    tiles: skinTiles,
                    parents: parentSkinTiles,
                    count: skinTiles.length
                }
            ],
            count: skinTiles.length
        };
    }

    getSkinLayer(index) {
        return this.getSkinLayers()[index];
    }

    getSkinLayers() {
        return this._skinLayers || EMPTY_ARRAY;
    }

    getSkinCount() {
        return this._skinLayers && this._skinLayers.length || 0;
    }

    queryTerrainByProjCoord(prjCoord) {
        const renderer = this.getRenderer();
        if (!renderer) {
            ALTITUDE[0] = null;
            ALTITUDE[1] = 0;
            return ALTITUDE;
        }
        const map = this.getMap();
        const worldPos = map['_prjToPointAtRes'](prjCoord, 1, POINT0);
        const tileInfo = renderer._getTerrainTileAtPoint(worldPos, 1);
        if (!tileInfo) {
            ALTITUDE[0] = null;
            ALTITUDE[1] = 0;
            return ALTITUDE;
        }
        return renderer._queryTerrain(ALTITUDE, tileInfo.id, tileInfo, worldPos, 1);
    }

    queryTileTerrainByProjCoord(prjCoord, tileId, tileIndex) {
        const renderer = this.getRenderer();
        if (!renderer) {
            ALTITUDE[0] = null;
            ALTITUDE[1] = 0;
            return ALTITUDE;
        }
        const map = this.getMap();
        const worldPos = map['_prjToPointAtRes'](prjCoord, 1, POINT0);
        return renderer._queryTerrain(ALTITUDE, tileId, tileIndex, worldPos, 1);
    }

    queryTileTerrainByPointAtRes(point, res, tileId, tileIndex) {
        const renderer = this.getRenderer();
        if (!renderer) {
            ALTITUDE[0] = null;
            ALTITUDE[1] = 0;
            return ALTITUDE;
        }
        return renderer._queryTerrain(ALTITUDE, tileId, tileIndex, point, res);
    }

    queryTerrain(coordinate) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return 0;
        }
        const projection = this.getMap().getProjection();
        const projCoord = projection.project(coordinate, COORD0);
        return this.queryTerrainByProjCoord(projCoord);
    }

    queryTileAltitude(out, tileExtent, res) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return null;
        }
        return renderer._queryTileAltitude(out, tileExtent, res);
    }

    queryTileMesh(tile, cb) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return;
        }
        renderer._queryTileMesh(tile, cb);
    }

    getTerrainTiles(tileInfo) {
        const { x, y, z, res, offset } = tileInfo;
        const tileSize = tileInfo.extent2d.getWidth();
        const tc = this['_getTileConfig']();
        const sr = this.getSpatialReference();
        const { res: terrainRes, zoom } = getSkinTileRes(sr, z, res);

        const terrainTileSize = this.getTileSize().width;

        const scale = getSkinTileScale(terrainRes, terrainTileSize, res, tileSize);

        const terrainTiles = getCascadeTileIds(this, x, y, zoom, offset, scale, 1)[0];
        for (let i = 0; i < terrainTiles.length; i++) {
            const { x: tx, y: ty } = terrainTiles[i];
            const nw = tc.getTilePointNW(tx, ty, terrainRes, POINT0);
            terrainTiles[i].res = terrainRes;
            terrainTiles[i].extent2d = new maptalks.PointExtent(nw.x, nw.y, nw.x + terrainTileSize, nw.y - terrainTileSize);
        }
        return terrainTiles;
    }

    isTerrainTileLoaded(tileId) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return false;
        }
        return renderer.isTileCached(tileId);
    }

    updateMaterial(mat) {
        if (!mat) {
            return;
        }
        if (!this.options['material']) {
            this.options['material'] = {};
        }
        extend(this.options['material'], mat);
        const renderer = this.getRenderer();
        if (!renderer) {
            return;
        }
        renderer.updateMaterial(mat);
    }

    setMaterial(mat) {
        if (!mat) {
            return;
        }
        this.options['material'] = mat;
        const renderer = this.getRenderer();
        if (!renderer) {
            return;
        }
        renderer.setMaterial(mat);
    }
}

TerrainLayer.include({
    '_getTileId': (x, y, z) => {
        // always assume terrain layer is pyramid mode
        // 由字符串操作改为数值操作，提升性能
        const total = Math.pow(4, z + 1);
        const row = Math.sqrt(total / 4);
        return '' + (total + x * row + y);
    }
})

TerrainLayer.mergeOptions(options);
TerrainLayer.registerJSONType('TerrainLayer');

TerrainLayer.registerRenderer('gl', TerrainLayerRenderer);
