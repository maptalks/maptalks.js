import * as maptalks from 'maptalks';
import { vec3, mat4 } from 'gl-matrix';
import TerrainWorkerConnection from './TerrainWorkerConnection';
import { createREGL } from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';
import vert from './glsl/terrain.vert';
import frag from './glsl/terrain.frag';

const V0 = [];
const V1 = [];
const V2 = [];
const V3 = [];

const POINT0 = new maptalks.Point(0, 0);
const POINT1 = new maptalks.Point(0, 0);
const TEMP_EXTENT = new maptalks.PointExtent(0, 0, 0, 0);
const SCALE3 = [];

class TerrainLayerRenderer extends maptalks.renderer.TileLayerCanvasRenderer {

    constructor(...args) {
        super(...args);
        this._scene = new reshader.Scene();
    }

    isDrawable() {
        return true;
    }

    consumeTile(tileImage, tileInfo) {
        if (tileImage && tileImage.mesh && !tileImage.terrainMesh) {
            tileImage.terrainMesh = this._createTerrainMesh(tileInfo, tileImage.mesh);
        }
        return super.consumeTile(tileImage, tileInfo);
    }

    draw(timestamp, parentContext) {
        this._scene.clear();
        super.draw(timestamp, parentContext);
        this._endFrame(parentContext);
    }

    drawOnInteracting(event, timestamp, parentContext) {
        this.draw(timestamp, parentContext);
    }

    drawTile(tileInfo, tileImage) {
        const map = this.getMap();
        if (!tileInfo || !map || !tileImage) {
            return;
        }
        const mesh = tileImage.terrainMesh;
        if (mesh) {
            const skinCount = this.layer.getSkinCount();
            if (mesh.properties.skinCount !== skinCount) {
                const defines = mesh.defines();
                defines['SKIN_COUNT'] = skinCount;
                mesh.properties.skinCount = skinCount;
                mesh.defines = defines;
            }
            this._scene.addMesh(mesh);
        }
    }

    _drawTiles(tiles, parentTiles, childTiles) {
        const skinCount = this.layer.getSkinCount();
        // 集中对每个SkinLayer调用renderTerrainSkin，减少 program 的切换开销
        for (let i = 0; i < skinCount; i++) {
            for (let ii = 0; ii < tiles.length; ii++) {
                this._drawTerrainSkin(i, tiles[ii].info, tiles[ii].image);
            }
            for (let ii = 0; ii < parentTiles.length; ii++) {
                this._drawTerrainSkin(i, parentTiles[ii].info, parentTiles[ii].image);
            }
            for (let ii = 0; ii < childTiles.length; ii++) {
                this._drawTerrainSkin(i, childTiles[ii].info, childTiles[ii].image);
            }
        }
        return super._drawTiles(...arguments);
    }

    _drawTerrainSkin(skinIndex, tileInfo, tileImage) {
        const map = this.getMap();
        if (!tileInfo || !map || !tileImage) {
            return;
        }
        const mesh = tileImage.terrainMesh;
        if (mesh) {
            const skinLayer = this.layer.getSkinLayer(skinIndex);
            const renderer = skinLayer.getRenderer();
            if (renderer) {
                renderer.renderTerrainSkin(this.regl, tileInfo, tileImage, skinIndex);
            }
            const emptyTexture = this._getEmptyTexture();
            const textures = mesh.getUniform('skins');
            const skins = tileImage.skins;
            for (let i = 0; i < skins.length; i++) {
                textures[i] = skins[i] || emptyTexture;
            }
        }
    }

    _endFrame(context) {
        const uniforms = this._getUniformValues();
        this.renderer.render(this._shader, uniforms, this._scene, this.getRenderFBO(context));
    }

    onDrawTileStart() {}
    onDrawTileEnd() {}

    _createTerrainMesh(tileInfo, terrainGeo) {
        const heightScale = this._getPointZ(100) / 100;
        for(let i = 2; i < terrainGeo.positions.length; i = i + 3) {
            terrainGeo.positions[i] *= heightScale;
        }
        const geo = new reshader.Geometry({
            POSITION: terrainGeo.positions,
            TEXCOORD_0: terrainGeo.texcoords
        },
        terrainGeo.triangles,
        0,
        {
            primitive: 'triangles',
            positionAttribute: 'POSITION',
            uv0Attribute: 'TEXCOORD_0'
        });

        geo.generateBuffers(this.regl);

        const skinCount = this.layer.getSkinCount();
        const mesh = new reshader.Mesh(geo);
        mesh.setDefines({
            'SKIN_COUNT': skinCount
        });

        mesh.properties.skinCount = skinCount;
        const textures = [];
        const emptyTexture = this._getEmptyTexture();
        for (let i = 0; i < skinCount; i++) {
            textures[i] = emptyTexture;
        }
        mesh.setUniform('skins', textures);

        const map = this.getMap();
        const scale = tileInfo.res / map.getGLRes();

        const { extent2d, offset } = tileInfo;
        vec3.set(V3, (extent2d.xmin - offset[0]) * scale, (tileInfo.extent2d.ymax - offset[1]) * scale, 0);
        const localTransform = mat4.identity([]);
        mat4.translate(localTransform, localTransform, V3);
        vec3.set(SCALE3, scale * 8, scale * 8, 1);
        mat4.scale(localTransform, localTransform, SCALE3);
        mesh.localTransform = localTransform;

        return mesh;
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
                this.onTileError(terrainData, tile);
                return;
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

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            this._createREGLContext();
        }
        this._emptyTileTexture = this.regl.texture(2, 2);
        this._resLoader = new reshader.ResourceLoader(this._emptyTileTexture);
        this.renderer = new reshader.Renderer(this.regl);
        this._initShader();
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

    _getEmptyTexture() {
        return this._emptyTileTexture;
    }


    _initShader() {
        const map = this.layer.getMap();
        this._uniforms = {
            'projViewMatrix' : map.projViewMatrix
        };
        const skinCount = this.layer.getSkinCount();

        this._shader = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
                {
                    name: 'skins',
                    type: 'array',
                    length: skinCount,
                    fn: (_, props) => {
                        return props['skinTextures'];
                    }
                }
            ],
            extraCommandProps: {
                viewport: {
                    x : 0,
                    y : 0,
                    width : () => {
                        return this.canvas ? this.canvas.width : 1;
                    },
                    height : () => {
                        return this.canvas ? this.canvas.height : 1;
                    }
                }
            }
        });
        // this._picking = new FBORayPicking(
        //     this.renderer,
        //     {
        //         vert : pickingVert,
        //         uniforms : [
        //             {
        //                 name : 'projViewModelMatrix',
        //                 type : 'function',
        //                 fn : function (context, props) {
        //                     return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
        //                 }
        //             }
        //         ]
        //     },
        //     this.pickingFBO
        // );
    }

    getRenderFBO(context) {
        //优先采用不aa的fbo
        return context && context.renderTarget && context.renderTarget.fbo;
    }


    _getUniformValues() {
        const map = this.getMap();
        const projViewMatrix = map.projViewMatrix;
        const uniforms = {
            projViewMatrix,
        };
        return uniforms;
    }

    needToRedraw() {
        return true;
    }
}

export default TerrainLayerRenderer;


maptalks.renderer.TileLayerCanvasRenderer.include({
    renderTerrainSkin(regl, tileInfo, tileImage, skinIndex) {
        if (!tileImage.skinImages) {
            tileImage.skinImages = [];
        }
        if (!tileImage.skins) {
             tileImage.skins = [];
        }
        if (!tileImage.skinStatus) {
            tileImage.skinStatus = [];
        }

        let texture = tileImage.skinImages[skinIndex];

        const status = tileImage.skinStatus[skinIndex];
        if (texture && status) {
            return;
        }
        const sr = this.layer.getSpatialReference();
        const { x, y, res, extent2d } = tileInfo;
        let w = Math.round(tileInfo.extent2d.getWidth());
        let h = Math.round(tileInfo.extent2d.getHeight());

        const zoom = this.getCurrentTileZoom();
        const myRes = sr.getResolution(zoom);
        const myTileSize = this.layer.getTileSize().width;

        let scale = myRes / res * w / myTileSize;
        if (scale < 1) {
            scale = 1 / scale;
            scale = 1 / Math.round(scale);
        } else {
            scale = Math.round(scale);
        }
        const resScale = myRes / res;
        const myX = scale * x;
        const myY = scale * y;

        const tileId = this.layer['_getTileId'](myX, myY, zoom);
        const cached = this.tileCache.get(tileId);
        if (cached) {
            const image = cached.image;
            let { width, height } = image;
            if (width === w && height === h) {
                texture = image;
                tileImage.skinImages[skinIndex] = image;
                tileImage.skinStatus[skinIndex] = 1;
                return texture;
            } else {
                if (!texture) {
                    texture = document.createElement('canvas');
                    if (!reshader.Util.isPowerOfTwo(w)) {
                        w = reshader.Util.floorPowerOfTwo(w);
                    }
                    if (!reshader.Util.isPowerOfTwo(h)) {
                        w = reshader.Util.floorPowerOfTwo(h);
                    }
                    texture.width = w;
                    texture.height = h;
                }
                const ctx = texture.getContext('2d');
                if (width > w && height > h) {
                    // skin瓦片比地形瓦片大
                    drawTileImage(ctx, extent2d, cached, resScale);
                    tileImage.skinImages[skinIndex] = image;
                    tileImage.skins[skinIndex] = regl.texture({
                        data: image,
                        width,
                        height
                    });
                    tileImage.skinStatus[skinIndex] = 1;
                } else {
                    // skin瓦片比地形瓦片小
                    const stride = Math.round(w / width);
                    let sum = stride * stride;
                    let count = 0;
                    for (let i = 0; i < stride; i++) {
                        for (let j = 0; j < stride; j++) {
                            let cachedTile;
                            if (i === 0 && j === 0) {
                                cachedTile = cached;
                            } else {
                                const tileX = myX + i;
                                const tileY = myY + j;
                                const tileId = this.layer['_getTileId'](tileX, tileY, zoom);
                                cachedTile = this.tileCache.get(tileId);
                            }

                            if (cachedTile) {
                                count++;
                                drawTileImage(ctx, extent2d, cachedTile, resScale);
                            } else {
                                //TODO 找父级瓦片
                            }
                        }
                    }
                    const debugCanvas = document.getElementById('terrain_skin_debug');
                    if (debugCanvas) {
                        debugCanvas.width = w;
                        debugCanvas.height = h;
                        debugCanvas.getContext('2d').drawImage(texture, 0, 0);
                    }

                    if (sum === count) {
                        tileImage.skinStatus[skinIndex] = 1;
                    }
                    let tex = tileImage.skins[skinIndex];
                    const config = {
                        data: texture,
                        width: w,
                        height: h
                    };
                    if (!tex) {
                        tex = regl.texture(config);
                    } else {
                        tex(config);
                    }
                    tileImage.skins[skinIndex] = tex;
                    tileImage.skinImages[skinIndex] = texture;
                    return texture;
                }
            }
        } else {
            //TODO 找父级瓦片
        }
    }
});


function drawTileImage(ctx, extent, tile, scale) {
    const { info, image } = tile;
    const width = image.width * scale;
    const height = image.height * scale;
    const xmin = info.extent2d.xmin / scale;
    const ymax = info.extent2d.ymax / scale;
    const left = Math.round((xmin - extent.xmin) / extent.getWidth()) * width;
    const top = Math.round((extent.ymax - ymax) / extent.getHeight()) * height;
    ctx.drawImage(image, left, top, width, height);
}
