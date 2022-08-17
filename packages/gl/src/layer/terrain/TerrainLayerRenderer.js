import * as maptalks from 'maptalks';
import { vec3 } from 'gl-matrix';
import TerrainWorkerConnection from './TerrainWorkerConnection';

const V0 = [];
const V1 = [];
const V2 = [];

const COORD0 = new maptalks.Coordinate(0, 0);
const COORD1 = new maptalks.Coordinate(0, 0);
const POINT0 = new maptalks.Point(0, 0);
const POINT1 = new maptalks.Point(0, 0);
const TEMP_EXTENT = new maptalks.PointExtent(0, 0, 0, 0);

class TerrainLayerRenderer extends maptalks.renderer.TileLayerCanvasRenderer {

    drawTile() {}

    onDrawTileStart() {}
    onDrawTileEnd() {}

    _queryTileMesh(tile, cb) {
        const width = this.layer.options['terrainTileSize'] + 1;
        this.workerConn.createTerrainMesh(tile, width, cb);
    }

    loadTile(tile) {
        const layer = this.layer;
        const type = layer.options.type;
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
        const terrainData = {};
        this.workerConn.fetchTerrain(terrainUrl, this.layer.options, (err, res) => {
            if (err) {
                console.warn(err);
            }
            maptalks.Util.extend(terrainData, res);
            this.consumeTile(terrainData, tile);
            this.setToRedraw();
        });
        return terrainData;
    }

    _queryAltitide(tileIndex, worldPos, z) {
        const tileId = this.layer['_getTileId'](tileIndex.x, tileIndex.y, z);
        const terrainData = this.tileCache.get(tileId);
        if (terrainData && terrainData.image) {
            const extent2d = terrainData.info.extent2d;
            const x = worldPos.x - extent2d.xmin;
            const y = worldPos.y - extent2d.ymin;
            // return this._findInTrinagle(terrainData.image, x, y);
            return this._queryAltitudeInHeights(terrainData.image.data, x / extent2d.getWidth(), y / extent2d.getHeight());
        } else {
            return 0;
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

    _queryTileAltitude(out, extent) {
        if (!out) {
            out = {
                tiles: {},
                dirty: true,
                complete: false
            };
        }
        const layer = this.layer;
        const map = this.getMap();

        const z = this.getCurrentTileZoom();
        const sp = layer.getSpatialReference();
        const res = sp.getResolution(z);
        const { xmin, ymin, xmax, ymax } = extent;

        const config = layer['_getTileConfig']();

        COORD0.set(xmin, ymin);
        const minIndex = config.getTileIndex(COORD0, res, true);
        COORD1.set(xmax, ymax);
        const maxIndex = config.getTileIndex(COORD1, res, true);

        const txmin = Math.min(minIndex.x, maxIndex.x);
        const txmax = Math.max(minIndex.x, maxIndex.x);

        const tymin = Math.min(minIndex.y, maxIndex.y);
        const tymax = Math.max(minIndex.y, maxIndex.y);

        map['_prjToPointAtRes'](COORD0, res, POINT0);
        map['_prjToPointAtRes'](COORD1, res, POINT1);
        const extent2d = TEMP_EXTENT.set(Math.min(POINT0.x, POINT1.x), Math.min(POINT0.y, POINT1.y), Math.max(POINT0.x, POINT1.x), Math.max(POINT0.y, POINT1.y));

        // martini 需要一点多余的数据
        const terrainSize = (layer.options['terrainTileSize'] || 256) + 1;
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
