import * as maptalks from 'maptalks';
import TerrainLayerRenderer from './TerrainLayerRenderer';
import { getTileIdsAtLevel, getSkinTileScale, getSkinTileRes } from './TerrainTileUtil';
import { pushIn } from '../util/util';

const COORD0 = new maptalks.Coordinate(0, 0);
const POINT0 = new maptalks.Point(0, 0);
const EMPTY_ARRAY = [];

const options = {
    'forceRenderOnMoving': true,
    'forceRenderOnZooming': true,
    'forceRenderOnRotating': true,
    'opacity': 1.0,
    'renderer': 'gl',
    'pyramidMode': 1,
    'terrainTileSize': 6,
    'terrainWidth': 65,
    'backZoomOffset': -5
};

const EMPTY_TILE_GRIDS = {
    tileGrids: [],
    count: 0
};


const SKU_ID = '01';
const TOKEN_VERSION = '1';
const base62chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

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
            const skuid = this._createSkuToken();
            terrainUrl += '?sku=' + skuid + '&access_token=' + this.options['accessToken'];
        } else if (type === 'cesium') {
            terrainUrl += '?extensions=octvertexnormals-watermask-metadata&v=1.2.0';
        }
        return terrainUrl;
    }

    _createSkuToken() {
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
        const sr = layer.getSpatialReference();
        const size = tiles[0].extent2d.getWidth();

        const dx = tileSysScale.x;
        const dy = tileSysScale.y;

        const skinTiles = [];
        for (let i = 0; i < tiles.length; i++) {
            const info = tiles[i];
            const { res } = info;
            const { res: skinRes, zoom } = getSkinTileRes(sr, info.z, res);
            const resScale = skinRes / res;
            const scale = getSkinTileScale(skinRes, tileSize, res, size);

            const { extent2d } = info;
            const leftX = scale * info.x;
            const topY = scale * info.y;
            if (!info.skinTileIds) {
                info.skinTileIds = {};
            }
            if (!info.skinTileIds[layerId]) {
                const layerTiles = [];

                const tileIds = getTileIdsAtLevel(layer, info.x, info.y, zoom, scale, 0);
                for (let i = 0; i < tileIds.length; i++) {
                    const skinTile = tileIds[i];
                    skinTile.idx = skinTile.x;
                    skinTile.idy = skinTile.y;
                    skinTile.res = skinRes;
                    skinTile.url = layer.getTileUrl(skinTile.x, skinTile.y, skinTile.z + layer.options['zoomOffset']);
                    skinTile.offset = info.offset;

                    const xOffset = dx * (skinTile.x - leftX) * tileSize;
                    const yOffset = dy * (skinTile.y - topY) * tileSize;
                    skinTile.extent2d = new maptalks.PointExtent(
                        extent2d.xmin * resScale + xOffset,
                        extent2d.ymin * resScale + yOffset,
                        extent2d.xmax * resScale + xOffset,
                        extent2d.ymax * resScale + yOffset,
                    );
                    layerTiles.push(skinTile);
                }
                info.skinTileIds[layerId] = layerTiles;
            }
            pushIn(skinTiles, info.skinTileIds[layerId]);
        }
        return {
            tileGrids: [
                {
                    extent: grid.extent,
                    tiles: skinTiles,
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

    queryTerrain(coordinate) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return 0;
        }
        const map = this.getMap();
        const sr = this.getSpatialReference();
        const zoom = renderer.getCurrentTileZoom();
        const res = sr.getResolution(zoom);
        const repeatWorld = this.options['repeatWorld'];
        const config = this['_getTileConfig']();
        const projection = map.getProjection();
        const projCoord = projection.project(coordinate, COORD0);
        const tileIndex = config.getTileIndex(projCoord, res, repeatWorld);

        const worldPos = map.coordToPointAtRes(coordinate, res, POINT0);
        return renderer._queryTerrain(tileIndex, worldPos, res, zoom);
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
}

TerrainLayer.include({
    '_getTileId': (x, y, z) => {
        // always assume terrain layer is pyramid mode
        // 由字符串操作改为数值操作，提升性能
        const row = Math.sqrt(Math.pow(4, z));
        return '' + ((z === 0 ? 0 : Math.pow(4, z - 1)) + x * row + y);
    }
})

TerrainLayer.mergeOptions(options);
TerrainLayer.registerJSONType('TerrainLayer');

TerrainLayer.registerRenderer('gl', TerrainLayerRenderer);
