import * as maptalks from 'maptalks';
import { vec3, mat4 } from 'gl-matrix';
import TerrainWorkerConnection from './TerrainWorkerConnection';
import { createREGL } from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';
import vert from './glsl/terrain.vert';
import frag from './glsl/terrain.frag';
import { getCascadeTileIds, getSkinTileScale, getSkinTileRes, getParentSkinTile } from './TerrainTileUtil';
import { isNil } from '../util/util.js';

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
            this.renderSkin(skinLayer, tileInfo, tileImage, skinIndex);
            const emptyTexture = this._getEmptyTexture();
            const textures = mesh.getUniform('skins');
            const skins = tileImage.skins;
            for (let i = 0; i < skins.length; i++) {
                textures[i] = skins[i] || emptyTexture;
            }
        }
    }

    renderSkin(skinLayer, tileInfo, tileImage, skinIndex) {
        if (!tileImage.skinImages) {
            tileImage.skinImages = [];
        }
        if (!tileImage.skins) {
             tileImage.skins = [];
        }
        if (!tileImage.skinStatus) {
            tileImage.skinStatus = [];
        }
        if (!tileImage.skinTileIds) {
            tileImage.skinTileIds = [];
        }
        const status = tileImage.skinStatus[skinIndex];
        if (status) {
            return;
        }
        const renderer = skinLayer.getRenderer();
        if (!renderer) {
             return;
        }

        const sr = skinLayer.getSpatialReference();
        const { x, y, z, res, extent2d } = tileInfo;
        let w = Math.round(extent2d.getWidth());
        let h = Math.round(extent2d.getHeight());

        // const zoom = this.getCurrentTileZoom();
        const { res: myRes, zoom } = getSkinTileRes(sr, z, res);

        const myTileSize = skinLayer.getTileSize().width;

        const scale = getSkinTileScale(myRes, myTileSize, res, w);

        let skinTileIds = tileImage.skinTileIds[skinIndex];
        if (!skinTileIds) {
            skinTileIds = tileImage.skinTileIds[skinIndex] = getCascadeTileIds(skinLayer, x, y, zoom, scale, SKIN_LEVEL_LIMIT);
        }
        const level0 = skinTileIds['0'];
        let complete = true;
        const tiles = [];
        let parentTile;
        for (let i = 0; i < level0.length; i++) {
            const tileId = level0[i].id;
            const cachedTile = renderer.tileCache.get(tileId);
            if (!cachedTile) {
                complete = false;
                if (!parentTile) {
                    parentTile = getParentSkinTile(skinLayer, level0[i].x, level0[i].y, level0[i].z, this.layer.options.backZoomOffset);
                }
                continue;
            }
            tiles.push(cachedTile);
        }

        let texture = tileImage.skinImages[skinIndex];
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

        renderer.renderTerrainSkin(this.regl, this.layer, tileInfo, texture, tiles, parentTile);
        const debugCanvas = document.getElementById('terrain_skin_debug');
        if (debugCanvas) {
            debugCanvas.width = w;
            debugCanvas.height = h;
            debugCanvas.getContext('2d').drawImage(texture, 0, 0);
        }
        const config = {
            data: texture,
            width: w,
            height: h
        };
        let tex = tileImage.skins[skinIndex];
        if (!tex) {
            tex = this.regl.texture(config);
        } else {
            tex(config);
        }
        tileImage.skins[skinIndex] = tex;
        if (complete) {
            tileImage.skinStatus[skinIndex] = 1;
            // save some memory
            tileImage.skinImages[skinIndex] = null;
        }
    }

    _endFrame(context) {
        const uniforms = this._getUniformValues();
        // 原始顺序是先画 parentTile，再画tile，所以这里要改为倒序绘制
        const meshes = this._scene.getMeshes().sort(terrainCompare);
        this._scene.setMeshes(meshes);
        this.renderer.render(this._shader, uniforms, this._scene, this.getRenderFBO(context));
        if (meshes.length && !Object.keys(this.tilesLoading).length) {
            this.layer.fire('terrainreadyandrender');
        }
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

        const maxZoom = this.layer.getSpatialReference().getMaxZoom();
        mesh.setUniform('level', maxZoom - tileInfo.z);

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
        const terrainUrl = tile.url;
        const terrainData = {};
        this.workerConn.fetchTerrain(terrainUrl, this.layer.options, (err, res) => {
            if (err) {
                if (err.canceled) {
                    return;
                }
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

    deleteTile(tile) {
        if (!tile || !tile.image) {
            return;
        }
        const { image } = tile;
        const skins = image.skins;
        if (skins && skins.length) {
            for (let i = 0; i < skins.length; i++) {
                if (skins[i] && skins[i].destroy) {
                    skins[i].destroy();
                }
            }
        }
        if (image.terrainMesh) {
            image.terrainMesh.geometry.dispose();
            image.terrainMesh.dispose();
        }
        delete image.skins;
        delete image.skinStatus;
        delete image.skinImages;
        delete image.skinTileIds;
        delete image.terrainMesh;
        delete image.mesh;
    }

    abortTileLoading(tileImage, tileInfo) {
        if (tileInfo && tileInfo.url) {
            if (this.workerConn) {
                this.workerConn.abortTerrain(tileInfo.url);
            }
        }
        super.abortTileLoading(tileImage, tileInfo);
    }

    _queryTerrain(tileIndex, worldPos, res, z) {
        const terrainData = this._findTerrainData(tileIndex.x, tileIndex.y, z, this.layer.options['backZoomOffset']);
        if (terrainData && terrainData.image) {
            const extent2d = terrainData.info.extent2d;
            const terrainRes = terrainData.info.res;
            const scale = terrainRes / res;
            const x = worldPos.x - extent2d.xmin * scale;
            const y = worldPos.y - extent2d.ymin * scale;
            return this._queryAltitudeInHeights(terrainData.image.data, x / (extent2d.getWidth() * scale), y / (extent2d.getHeight() * scale));
        } else {
            return 0;
        }
    }

    _findTerrainData(x, y, z, limit) {
        const tileId = this.layer['_getTileId'](x, y, z);
        let terrainData = this.tileCache.get(tileId);
        if (!terrainData && limit <= 0) {
            return this._findTerrainData(Math.floor(x / 2), Math.floor(y / 2), z - 1, limit + 1);
        }
        return terrainData;
    }

    _queryAltitudeInHeights(terrainData, x, y) {
        const { width, height, data } = terrainData;
        const tx = Math.floor(width * x);
        const ty = Math.floor(height * y);
        return data[tx * width + ty];
    }


    _getPointZ(height) {
        const map = this.layer.getMap();
        if (!map) {
            return null;
        }
        const altitude = map.altitudeToPoint(height, map.getGLRes());
        return altitude;
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
        if (this._shader) {
            this._shader.dispose();
            delete this._shader;
        }
        if (this._emptyTileTexture) {
            this._emptyTileTexture.destroy();
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
        const projViewModelMatrix = [];

        this._shader = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    }
                },
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
                },
                stencil: {
                    enable: true,
                    func: {
                        cmp: () => {
                            return '<';
                        },
                        ref: (context, props) => {
                            return props.level;
                        }
                    },
                    op: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    }
                },
                depth: {
                    enable: true,
                    mask: () => {
                        const depthMask = this.layer.options['depthMask'];
                        return depthMask;
                    },
                    func: this.layer.options.depthFunc || '<='
                },
                blend: {
                enable: true,
                    func: { src: this.layer.options.blendSrc, dst: this.layer.options.blendDst },
                    equation: 'add'
                },
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
        let opacity = this.layer.options.opacity;
        if (isNil(opacity)) {
            opacity = 1;
        }
        const uniforms = {
            opacity,
            projViewMatrix,
        };
        return uniforms;
    }
}

export default TerrainLayerRenderer;

const SKIN_LEVEL_LIMIT = 4;

maptalks.renderer.TileLayerCanvasRenderer.include({
    renderTerrainSkin(regl, terrainLayer, tileInfo, texture, tiles, parentTile) {
        const { res, extent2d } = tileInfo;
        const ctx = texture.getContext('2d');
        if (parentTile) {
            drawTileImage(ctx, extent2d, parentTile, res);
        }
        for (let i = 0; i < tiles.length; i++) {
            drawTileImage(ctx, extent2d, tiles[i], res);
        }

    }
});


function drawTileImage(ctx, extent, tile, res) {
    const scale = tile.info.res / res;
    const { info, image } = tile;
    const width = image.width * scale;
    const height = image.height * scale;
    const xmin = info.extent2d.xmin * scale;
    const ymax = info.extent2d.ymax * scale;
    const left = Math.round(xmin - extent.xmin);
    const top = Math.round(extent.ymax - ymax);
    ctx.drawImage(image, left, top, width, height);
}

function terrainCompare(mesh0, mesh1) {
    return mesh0.getUniform('level') - mesh1.getUniform('level');
}
