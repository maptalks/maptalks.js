import * as maptalks from 'maptalks';
import { vec3 } from 'gl-matrix';
import TerrainWorkerConnection from './TerrainWorkerConnection';

const V0 = [];
const V1 = [];
const V2 = [];

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
            return this._findInTrinagle(terrainData.image, x, y);
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
