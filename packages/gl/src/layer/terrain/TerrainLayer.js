import * as maptalks from 'maptalks';
import TerrainLayerRenderer from './TerrainLayerRenderer';
import { getTileIdsAtLevel, getSkinTileScale, getSkinTileRes, getCascadeTileIds } from './TerrainTileUtil';
import { extend } from '../util/util';
import MaskLayerMixin from '../mask/MaskLayerMixin';

const COORD0 = new maptalks.Coordinate(0, 0);
const TEMP_POINT = new maptalks.Coordinate(0, 0);
const POINT0 = new maptalks.Point(0, 0);
const EMPTY_ARRAY = [];

const options = {
    'forceRenderOnMoving': true,
    'forceRenderOnZooming': true,
    'forceRenderOnRotating': true,
    'fadeAnimation': false,
    'fadeDuration': (1000 / 60 * 15),
    'tileLimitPerFrame': 2,
    'newTerrainTileRenderLimitPerFrameOnInteracting': 1,
    'opacity': 1.0,
    'renderer': 'gl',
    'pyramidMode': 1,
    'tileSize': 512,
    'terrainWidth': null,
    'backZoomOffset': 0,
    'depthMask': true,
    'blendSrc': 'one',
    'blendDst': 'one minus src alpha',
    'requireSkuToken': true,
    'cesiumIonTokenURL': 'https://api.cesium.com/v1/assets/1/endpoint?access_token=',
    'tileRetryCount': 0,
    'shader': 'default',
    'terrainTileMode': true,
    'tempTileCacheSize': 64,
    'tileStackStartDepth': 7,
    'tileStackDepth': 6,
    'currentTilesFirst': false,
    'exaggeration': 1,
    'colors': []
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
export default class TerrainLayer extends MaskLayerMixin(maptalks.TileLayer) {
    constructor(id, options) {
        if (options && !options.tileSystem) {
            if ((options.type === 'cesium' || options.type === 'cesium-ion')) {
                options.tileSystem = [1, 1, -180, -90];
            } else if (options.type === 'tianditu') {
                options.tileSystem = [1, -1, -180, 90];
            }
        }
        if (!options.tileSize) {
            if (options.type === 'mapbox') {
                options.tileSize = 512;
            }
        }
        super(id, options);
    }

    onAdd() {
        const options = this.options;
        const map = this.getMap();
        const projection = map.getProjection();
        const is4326 = projection.code === "EPSG:4326" || projection.code === "EPSG:4490";
        const is3857 = projection.code === "EPSG:3857";
        if (!options.spatialReference) {
            if (options.type === 'mapbox') {
                if (is4326) {
                    options.spatialReference = 'preset-4326-512';
                } else if (is3857) {
                    options.spatialReference = 'preset-3857-512';
                }
            } else if (options.type === 'cesium' || options.type === 'cesium-ion') {
                options.spatialReference = 'preset-4326-512';
            } else if (options.type === 'tianditu') {
                options.spatialReference = {
                    'projection': 'EPSG:4326',
                    'fullExtent': {
                        'top': 90,
                        'left': -180,
                        'bottom': -90,
                        'right': 180
                    },
                    'resolutions': (function () {
                        const resolutions = [];
                        for (let i = 0; i <= 22; i++) {
                            resolutions[i] = 180 / 2 / (Math.pow(2, i) * 128);
                        }
                        return resolutions;
                    })()
                };
            }
        }
        if (!options.terrainWidth && options.type === 'tianditu') {
            // tianditu's terrainWidth has to be 65, decided by the terrain format
            options.terrainWidth = 65;
        }
    }

    getTileUrl(x, y, z) {
        let terrainUrl = super.getTileUrl(x, y, z);
        const type = this.options.type;
        // if (type === 'cesium') {
        //     z = z - 1;
        //     const yTiles = 1 << z;
        //     y =  yTiles - y - 1;
        // }
        if (type === 'mapbox' && this.options['requireSkuToken']) {
            if (!this._skuToken) {
                this._skuToken = this._createSkuToken();
            }
            if (terrainUrl.indexOf('?') > -1) {
                terrainUrl += '&sku=' + this._skuToken;
            } else {
                terrainUrl += '?sku=' + this._skuToken;
            }
        }/* else if (type === 'cesium') {
            terrainUrl += '?extensions=octvertexnormals-watermask-metadata&v=1.2.0';
        }*/
        return terrainUrl;
    }

    getMaxAvailableZoom() {
        // 这里重载了TileLayer里的getMaxAvailableZoom，没有读取 layer.options.maxAvalibleZoom
        // 原因是在TerrainLayerRenderer中会用maxAvaibleZoom的瓦片数据，实时切分出当前请求请求的瓦片
        // 例如如果 maxAvailbleZoom 是14，16级的地形瓦片是从14级瓦片中切分出来的。
        // 这样可以让skin layer的渲染逻辑更简单明确
        const sr = this.getSpatialReference();
        return sr.getMaxZoom();
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
        const map = this.getMap();
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
        const scaleY = this['_getTileConfig']().tileSystem.scale.y;

        for (let i = 0; i < allTiles.length; i++) {
            const info = allTiles[i];
            const { res } = info;
            let nw = info.nw;
            if (!nw) {
                nw = info.nw = map.pointAtResToCoord(info.extent2d.getMin(POINT0), info.res);
            }
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
                const tileIds = getTileIdsAtLevel(layer, info.x, info.y, zoom, nw, offset, dy, scale, 0);
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
                    const yOffset = dy * (skinTile.skinY - topY) * tileSize;
                    const xmin = extent2d.xmin * resScale + xOffset;
                    const ymax = extent2d.ymax * resScale + yOffset;
                    const ymin = extent2d.ymin * resScale + yOffset;
                    if (scaleY > 0) {
                        skinTile.extent2d = new maptalks.PointExtent(
                            xmin,
                            ymin,
                            xmin + tileSize,
                            ymin + tileSize
                        );
                    } else {
                        skinTile.extent2d = new maptalks.PointExtent(
                            xmin,
                            ymax - tileSize,
                            xmin + tileSize,
                            ymax
                        );
                    }

                    skinTileIds.add(skinTile.id);
                    layerTiles.push(skinTile);
                }
                info.skinTileIds[layerId] = layerTiles;
            }
            const tileSkinTiles = info.skinTileIds[layerId];
            for (let j = 0; j < tileSkinTiles.length; j++) {
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

    queryTerrainByProjCoord(prjCoord, out) {
        out = out || [];
        const renderer = this.getRenderer();
        if (!renderer) {
            out[0] = null;
            out[1] = 0;
            return out;
        }
        const map = this.getMap();
        const tileInfo = renderer._getTerrainTileAtPrjCoord(prjCoord);
        if (!tileInfo) {
            out[0] = null;
            out[1] = 0;
            return out;
        }
        const worldPos = map['_prjToPointAtRes'](prjCoord, 1, POINT0);
        return renderer._queryTerrain(out, tileInfo.id, tileInfo, worldPos, 1);
    }

    queryTileTerrainByProjCoord(prjCoord, tileId, tileIndex, out) {
        out = out || [];
        const renderer = this.getRenderer();
        if (!renderer) {
            out[0] = null;
            out[1] = 0;
            return out;
        }
        const map = this.getMap();
        const worldPos = map['_prjToPointAtRes'](prjCoord, 1, POINT0);
        return renderer._queryTerrain(out, tileId, tileIndex, worldPos, 1);
    }

    queryTileTerrainByPointAtRes(point, res, tileId, tileIndex, out) {
        out = out || [];
        const renderer = this.getRenderer();
        if (!renderer) {
            out[0] = null;
            out[1] = 0;
            return out;
        }
        return renderer._queryTerrain(out, tileId, tileIndex, point, res);
    }

    queryTerrain(coordinate, out) {
        out = out || [];
        const renderer = this.getRenderer();
        if (!renderer) {
            out[0] = null;
            out[1] = 0;
            return out;
        }
        const projection = this.getMap().getProjection();
        const projCoord = projection.project(coordinate, COORD0);
        return this.queryTerrainByProjCoord(projCoord, out);
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
        let nw = tileInfo.nw;
        if (!nw) {
            nw = tileInfo.nw = this.getMap().pointAtResToCoord(tileInfo.extent2d.getMin(POINT0), tileInfo.res);
        }

        const terrainTiles = getCascadeTileIds(this, x, y, zoom, nw, offset, tc.tileSystem.scale.y, scale, 1)[0];
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

    _createTileNode(x, y, z, idx, idy, res, error, parentId, extent2d, tileId) {
        const map = this.getMap();
        const zoomOffset = this.options['zoomOffset'];
        if (!extent2d) {
            const tileConfig = this._getTileConfig();
            extent2d = tileConfig.getTilePrjExtent(x, y, res).convertTo(c => map._prjToPointAtRes(c, res, TEMP_POINT));
        }
        const offset = this._getTileOffset(z);

        return {
            parent: parentId,
            layer: this.getId(),
            x: x,
            y,
            z,
            idx,
            idy,
            res,
            extent2d,
            id: tileId || this._getTileId(x, y, z),
            url: this.getTileUrl(x, y, z + zoomOffset),
            offset,
            error,
            children: []
        };
    }
}

// TerrainLayer.include({
//     getTileId: (x, y, z) => {
//         // always assume terrain layer is pyramid mode
//         // 由字符串操作改为数值操作，提升性能
//         const total = Math.pow(4, z + 1);
//         const row = Math.sqrt(total / 4);
//         return '' + (total + x * row + y);
//     }
// })

TerrainLayer.mergeOptions(options);
TerrainLayer.registerJSONType('TerrainLayer');

TerrainLayer.registerRenderer('gl', TerrainLayerRenderer);
