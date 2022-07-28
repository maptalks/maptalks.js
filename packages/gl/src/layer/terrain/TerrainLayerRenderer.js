import * as maptalks from 'maptalks';
import { vec3 } from 'gl-matrix';
import TerrainWorkerConnection from './TerrainWorkerConnection';

const V0 = [];
const V1 = [];
const V2 = [];

const POINT0 = new maptalks.Point(0, 0);
const POINT1 = new maptalks.Point(0, 0);

class TerrainLayerRenderer extends maptalks.renderer.TileLayerCanvasRenderer {

    draw(...args) {
        super.draw(...args);
    }

    drawOnInteracting(...args) {
        super.draw(...args);
    }

    isDrawable() {
        return true;
    }

    _getTilesInCurrentFrame() {
        const map = this.getMap();
        const layer = this.layer;
        const tileGrids = layer.getTiles().tileGrids;
        if (!tileGrids || !tileGrids.length) {
            return null;
        }
        const count = tileGrids.reduce((acc, curr) => acc + (curr && curr.tiles && curr.tiles.length || 0), 0);
        if (count >= (this.tileCache.max / 2)) {
            this.tileCache.setMaxSize(count * 2 + 1);
        }
        let loadingCount = 0;
        let loading = false;
        const checkedTiles = {};
        const tiles = [],
            parentTiles = [], parentKeys = {},
            childTiles = [], childKeys = {};
        //visit all the tiles
        const tileQueue = {};
        const preLoadingCount = this['_markTiles'](),
            loadingLimit = this['_getLoadLimit']();

        const gridCount = tileGrids.length;

        // main tile grid is the last one (draws on top)
        this['_tileZoom'] = tileGrids[1]['zoom'];

        // tileGrids[0] 是地形瓦片
        const tileGrid = tileGrids[1];
        const allTiles = tileGrid['tiles'];


        for (let i = 0, l = allTiles.length; i < l; i++) {
            const tile = allTiles[i];
            const tileId = tile['id'];
            let terrainData = this._getCachedTerrainTile(tileId);
            if (isTerrainComplete(terrainData)) {
                tiles.push(terrainData);
                continue;
            } else {
                terrainData = {
                    skins: []
                };
            }
            for (let j = 1; j < gridCount; j++) {
                const tile = tileGrids[j].tiles[i];
                const tileId = tile['id'];
                let tileLoading = false;
                if (this._isLoadingTile(tileId)) {
                    tileLoading = loading = true;
                    this.tilesLoading[tileId].current = true;
                } else {
                    const cached = this._getCachedTile(tileId);
                    if (cached) {
                        tiles.push(cached);
                    } else {
                        tileLoading = loading = true;
                        const hitLimit = loadingLimit && (loadingCount + preLoadingCount[0]) > loadingLimit;
                        if (!hitLimit && (!map.isInteracting() || (map.isMoving() || map.isRotating()))) {
                            loadingCount++;
                            const key = tileId;
                            tileQueue[key] = tile;
                        }
                    }
                }
            }

            //load tile in cache at first if it has.

            if (!tileLoading) continue;
            if (checkedTiles[tileId]) {
                continue;
            }

            checkedTiles[tileId] = 1;

            const parentTile = this._findParentTile(tile);
            if (parentTile) {
                const parentId = parentTile.info.id;
                if (parentKeys[parentId] === undefined) {
                    parentKeys[parentId] = parentTiles.length;
                    parentTiles.push(parentTile);
                }/* else {
                    //replace with parentTile of above tiles
                    parentTiles[parentKeys[parentId]] = parentTile;
                } */
            } else if (!parentTiles.length) {
                const children = this._findChildTiles(tile);
                if (children.length) {
                    children.forEach(c => {
                        if (!childKeys[c.info.id]) {
                            childTiles.push(c);
                            childKeys[c.info.id] = 1;
                        }
                    });
                }
            }
        }


        if (parentTiles.length) {
            childTiles.length = 0;
            this._childTiles.length = 0;
        }
        return {
            childTiles, parentTiles, tiles, placeholders, loading, loadingCount, tileQueue
        };
    }

    _getCachedTerrainTile(tileId) {
        return this._terrainCache.get(tileId);
    }

    drawTile() {}

    loadTile(tile) {
        const type = this.layer.options.type;
        let x, y, z;
        if (type === 'cesium') {
            x = tile.x;
            z = tile.z - 1;
            const yTiles = 1 << z;
            y =  yTiles - tile.y - 1;
        } else {
            x = tile.x, y = tile.y, z = tile.z;
        }
        let terrainUrl = this.layer.getTileUrl(x, y, z);
        if (type === 'mapbox') {
            const skuid = this._createSkuToken();
            terrainUrl += '.webp?sku=' + skuid + '&access_token=' + this.layer.options['accessToken'];
        } else if (type === 'cesium') {
            terrainUrl += '?extensions=octvertexnormals-watermask-metadata&v=1.2.0';
        }
        this.workerConn.fetchTerrain(terrainUrl, this.layer.options, (err, res) => {
            if (err) {
                console.warn(err);
            }
            this.onTileLoad(res, tile);
            this.setToRedraw();
        });
        return {};
    }

    _queryAltitide(tileIndex, worldPos, z) {
        const tileId = this.layer['_getTileId'](tileIndex.x, tileIndex.y, z);
        const terrainData = this.tileCache.get(tileId);
        if (terrainData) {
            const extent2d = terrainData.info.extent2d;
            const x = worldPos.x - extent2d.xmin;
            const y = worldPos.y - extent2d.ymin;
            // return this._findInTrinagle(terrainData.image, x, y);
            return this._queryAltitudeInHeights(terrainData.image, x / extent2d.getWidth(), y / extent2d.getHeight());
        } else {
            console.warn('terrain data has not been loaded');
        }
    }


    _getPointZ(height) {
        const map = this.layer.getMap();
        if (!map) {
            return null;
        }
        const altitude = map.altitudeToPoint(height, map.getGLRes());
        return altitude;
    }


    _findInTrinagle(terrainData, x, y) {
        const exaggeration = this.layer.options['exaggeration'] || 1;
        const positions = terrainData.positions;
        const triangles = terrainData.triangles;
        let x0, x1, x2, y0, y1, y2;
        const count = triangles.length / 3;
        for (let i = 0; i < count; i++) {
            const aIndex = triangles[i * 3], bIndex = triangles[i * 3 + 1], cIndex = triangles[i * 3 + 2];
            if (x < positions[aIndex * 3] && x < positions[bIndex * 3] && x < positions[cIndex * 3] || x > positions[aIndex * 3] && x > positions[bIndex * 3] && x > positions[cIndex * 3] ||
                y < -positions[aIndex * 3 + 1] && y < -positions[bIndex * 3 + 1] && y < -positions[cIndex * 3 + 1] || y > -positions[aIndex * 3 + 1] && y > -positions[bIndex * 3 + 1] && y > -positions[cIndex * 3 + 1]) {
                continue;
            }
            y0 = -positions[aIndex * 3 + 1];
            y1 = -positions[bIndex * 3 + 1];
            y2 = -positions[cIndex * 3 + 1];
            x0 = positions[aIndex * 3];
            x1 = positions[bIndex * 3];
            x2 = positions[cIndex * 3];
            const A = vec3.set(V0, x0, y0, positions[aIndex * 3 + 2]);
            const B = vec3.set(V1, x1, y1, positions[bIndex * 3 + 2]);
            const C = vec3.set(V2, x2, y2, positions[cIndex * 3 + 2]);
            const SABC = this._calTriangleArae(A[0], A[1], B[0], B[1], C[0], C[1]);
            const SPAC = this._calTriangleArae(x, y, A[0], A[1], C[0], C[1]);
            const SPAB = this._calTriangleArae(x, y, A[0], A[1], B[0], B[1]);
            const SPBC = this._calTriangleArae(x, y, B[0], B[1], C[0], C[1]);
            if (SPAC + SPAB + SPBC - SABC > 0.0001) {
                continue;
            } else {
                // A[1] = -A[1];
                // B[1] = -B[1];
                // C[1] = -C[1];
                return (A[2] + B[2] + C[2]) * 50 / 3 * exaggeration;
            }
        }
    }

    _queryTileAltitudes(tileInfo) {
        const layer = this.layer;
        let { extent2d } = tileInfo;
        const { xmin, ymin, xmax, ymax } = extent2d;
        const config = layer['_getTileConfig']();

        const z = this.getCurrentTileZoom();
        const sp = layer.getSpatialReference();
        const res = sp.getResolution(z);
        POINT0.set(xmin, ymin);
        const minIndex = config['_getTileNum'](POINT0, res);
        POINT1.set(xmax, ymax);
        const maxIndex = config['_getTileNum'](POINT1, res);

        const txmin = Math.min(minIndex.x, maxIndex.x);
        const txmax = Math.max(minIndex.x, maxIndex.x);

        const tymin = Math.min(minIndex.y, maxIndex.y);
        const tymax = Math.max(minIndex.y, maxIndex.y);

        // martini 需要一点多余的数据
        const terrainSize = (layer.options['terrainSize'] || 256) + 1;
        // 扩大一个像素
        extent2d = extent2d.add(extent2d.getWidth() / terrainSize);
        const out = new Float32Array(terrainSize * terrainSize);
        for (let i = txmin; i <= txmax; i++) {
            for (let j = tymin; j <= tymax; j++) {
                const tileId = this.layer['_getTileId'](i, j, z);
                const terrainData = this.tileCache.get(tileId);
                // 如果当前瓦片找不到，则查询父级瓦片
                if (terrainData) {
                   this._fillAltitudeData(out, terrainData, extent2d. terrainSize);
                }
            }
        }
    }

    _fillAltitudeData(out, terrainData, extentTerrain, extent2d, terrainSize) {
        const terrainExtent = terrainData.info.extent2d;
        const intersection = terrainExtent.intersection(extent2d);
        const { xmin, ymin, xmax, ymax } = intersection;

        const { width, data } = terrainData;
        const unit = extent2d.getWidth() / terrainSize;

        const xstart = Math.floor((xmin - extent2d.xmin) / unit);
        const ystart = Math.floor((ymin - extent2d.ymin) / unit);
        const xend = Math.floor((xmax - extent2d.xmin) / unit);
        const yend = Math.floor((ymax - extent2d.ymin) / unit);

        const xspan = xend - xstart;
        const yspan = yend - ystart;

        const tunit = terrainExtent.getWidth() / terrainData.data.width;
        const tstartx = Math.floor((xmin - extentTerrain.xmin) / tunit);
        const tstarty = Math.floor((ymin - extentTerrain.ymin) / tunit);
        const stride = unit / tunit;

        for (let i = 0; i <= xspan; i++) {
            for (let j = 0; j <= yspan; j++) {
                const index = i + xstart + (ystart + j) * width;
                let height = 0;
                for (let k = 0; k < stride; k++) {
                    const terrainIndex = tstartx + Math.floor(i * stride) + k + (tstarty + Math.floor(j * stride) + k) * width;
                    height += data[terrainIndex];
                }
                out[index] = height / Math.max(stride, 1);
            }
        }
        return out;
    }

    _queryAltitudeInHeights(terrainData, x, y) {
        const { width, height, data } = terrainData;
        const tx = Math.floor(width * x);
        const ty = Math.floor(height * y);
        return data[tx * width + ty];
    }

    _calTriangleArae(x1, y1, x2, y2, x3, y3) {
        return Math.abs(x1 * y2 + x2 * y3 + x3 * y1 - x1 * y3 - x2 * y1 - x3 * y2) * 0.5;
    }

    _createSkuToken() {
        const SKU_ID = '01';
        const TOKEN_VERSION = '1';
        const base62chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let sessionRandomizer = '';
        for (let i = 0; i < 10; i++) {
            sessionRandomizer += base62chars[Math.floor(Math.random() * 62)];
        }
        const token = [TOKEN_VERSION, SKU_ID, sessionRandomizer].join('');

        return token;
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

}

export default TerrainLayerRenderer;

function isTerrainComplete(tile, tilesCount) {
    if (!tile || !tile.terrain || tile.skins.length < tilesCount) {
        return false;
    }
    for (let i = 0; i < tile.skins.length; i++) {
        if (!tile.skins[i]) {
            return false;
        }
    }
    return true;
}
