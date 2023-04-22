import * as maptalks from 'maptalks';
import { vec3, mat4 } from 'gl-matrix';
import TerrainWorkerConnection from './TerrainWorkerConnection';
import { createREGL } from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';
import vert from './glsl/terrain.vert';
import frag from './glsl/terrain.frag';
import { getCascadeTileIds, getSkinTileScale, getSkinTileRes, getParentSkinTile } from './TerrainTileUtil';

const V3 = [];

const POINT0 = new maptalks.Point(0, 0);
const POINT1 = new maptalks.Point(0, 0);
const TEMP_EXTENT = new maptalks.PointExtent(0, 0, 0, 0);
const TEMP_POINT = new maptalks.Point(0, 0);
const SCALE3 = [];

const DEBUG_POINT = new maptalks.Point(20, 20);

const FALSE_COLOR_MASK = [false, false, false, false];
const TRUE_COLOR_MASK = [true, true, true, true];

class TerrainLayerRenderer extends maptalks.renderer.TileLayerCanvasRenderer {

    constructor(...args) {
        super(...args);
        this._leafScene = new reshader.Scene();
        this._parentScene = new reshader.Scene();
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
        this._leafScene.clear();
        this._parentScene.clear();
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
        const mesh = tileImage.terrainMesh;
        if (mesh) {
            mesh.setUniform('opacity', opacity);
            const skinCount = this.layer.getSkinCount();
            if (mesh.properties.skinCount !== skinCount) {
                const defines = mesh.defines();
                defines['SKIN_COUNT'] = skinCount;
                mesh.properties.skinCount = skinCount;
                mesh.defines = defines;
            }
            const maxZoom = this.layer.getSpatialReference().getMaxZoom();
            const isLeaf = this.drawingCurrentTiles === true;
            mesh.setUniform('stencilRef', isLeaf ? 0 : 1 + maxZoom - tileInfo.z);
            mesh.setUniform('isParent', isLeaf ? 0 : 1);
            mesh.setUniform('debugColor', isLeaf ? [1, 1, 1, 1] : [1, 1, 1, 1]);
            if (isLeaf) {
                this._leafScene.addMesh(mesh);
            } else {
                this._parentScene.addMesh(mesh);
            }
        }
    }

    // getTileOpacity(tileImage) {
    //     const opacity = super.getTileOpacity(tileImage);
    //     if (opacity < 1) {
    //         return opacity;
    //     }
    //     const skinCount = this.layer.getSkinCount();
    //     const skinStatus = tileImage.skinStatus;
    //     if (!skinStatus) {
    //         return 0.99;
    //     }
    //     for (let i = 0; i < skinCount; i++) {
    //         if (!skinStatus[i]) {
    //             return 0.99
    //         }
    //     }
    //     return 1;
    // }

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
        const renderer = skinLayer.getRenderer();
        if (!renderer) {
            return;
        }
        if (!tileImage.skins) {
            tileImage.skins = [];
        }
        if (!tileImage.skinImages) {
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
            return;
        }

        const sr = skinLayer.getSpatialReference();
        const { x, y, z, res, offset } = tileInfo;
        const tileSize = this.layer.getTileSize().width;
        let w = tileSize;
        let h = tileSize;

        // const zoom = this.getCurrentTileZoom();
        const { res: myRes, zoom } = getSkinTileRes(sr, z, res);

        const myTileSize = skinLayer.getTileSize().width;

        const scale = getSkinTileScale(myRes, myTileSize, res, w);

        let skinTileIds = tileImage.skinTileIds[skinIndex];
        if (!skinTileIds) {
            skinTileIds = tileImage.skinTileIds[skinIndex] = getCascadeTileIds(skinLayer, x, y, zoom, offset, scale, SKIN_LEVEL_LIMIT);
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
            if (!reshader.Util.isPowerOfTwo(w)) {
                w = reshader.Util.floorPowerOfTwo(w);
            }
            if (!reshader.Util.isPowerOfTwo(h)) {
                w = reshader.Util.floorPowerOfTwo(h);
            }
            texture = renderer.createTerrainTexture(w, h);
            tileImage.skinImages[skinIndex] = texture;
        }

        renderer.renderTerrainSkin(this.regl, this.layer, tileInfo, texture, tiles, parentTile);
        skinLayer.fire('renderterrainskin', { tile: tileInfo, skinTiles: tiles });

        if (texture instanceof HTMLCanvasElement) {
            const debugCanvas = document.getElementById('terrain_skin_debug');
            if (debugCanvas) {
                debugCanvas.width = w;
                debugCanvas.height = h;
                debugCanvas.getContext('2d').drawImage(texture, 0, 0);
            }
        }

        let tex;
        if (!texture.destroy) {
            // 有destroy说明是个regl对象，例如fbo或texture，则直接用它作为纹理
            const config = {
                data: texture,
                width: w,
                height: h,
                flipY: true,
                mipmap: true,
                min: 'mipmap',
                mag: 'linear'
            };
            tex = tileImage.skins[skinIndex];
            if (!tex) {
                tex = this.regl.texture(config);
            } else {
                tex(config);
            }
        } else {
            tex = texture;
        }


        tileImage.skins[skinIndex] = tex;
        if (complete) {
            tileImage.skinStatus[skinIndex] = 1;
            // save some memory
            if (!needRefresh) {
                tileImage.skinTileIds = [];
                tileImage.skinImages[skinIndex] = null;
            }
        }
    }

    _endFrame(context) {
        const enableFading = this.layer.options['fadeAnimation'] && this.layer.options['fadeDuration'] > 0;

        const uniforms = this._getUniformValues();

        const fbo = this.getRenderFBO(context);
        uniforms.cullFace = 'front';
        uniforms.enableStencil = false;
        uniforms.colorMask = false;
        uniforms.depthMask = true;
        this.renderer.render(this._shader, uniforms, this._parentScene, fbo);

        uniforms.enableStencil = true;
        uniforms.colorMask = true;
        uniforms.cullFace = 'back';

        this._parentScene.meshes.sort(terrainMeshCompare);

        if (enableFading) {
            // draw parent terrain surface，禁用深度值写入，作为叶子瓦片fading的背景
            uniforms.depthMask = false;
            this._parentScene.meshes.forEach(m => {
                const skirtOffset = m.properties.skirtOffset;
                m.geometry.setDrawOffset(0);
                m.geometry.setDrawCount(skirtOffset);
            });
            this.renderer.render(this._shader, uniforms, this._parentScene, fbo);
            uniforms.depthMask = true;
        }

        // draw leafs terrain surface
        this._leafScene.meshes.forEach(m => {
            const skirtOffset = m.properties.skirtOffset;
            m.geometry.setDrawOffset(0);
            m.geometry.setDrawCount(skirtOffset);
        });
        this.renderer.render(this._shader, uniforms, this._leafScene, fbo);

        // write parent terrain surface depth，因为上面已经绘制过，这里无需再次绘制
        if (enableFading) {
            uniforms.colorMask = false;
        }
        this.renderer.render(this._shader, uniforms, this._parentScene, fbo);

        // draw parent terrain skirts
        uniforms.colorMask = true;
        this._parentScene.meshes.forEach(m => {
            const { skirtOffset, skirtCount } = m.properties;
            m.geometry.setDrawOffset(skirtOffset);
            m.geometry.setDrawCount(skirtCount);
        });
        this.renderer.render(this._shader, uniforms, this._parentScene, fbo);


        // draw leafs skirts

        this._leafScene.meshes.forEach(m => {
            const { skirtOffset, skirtCount } = m.properties;
            m.geometry.setDrawOffset(skirtOffset);
            m.geometry.setDrawCount(skirtCount);
        });
        this.renderer.render(this._shader, uniforms, this._leafScene, fbo);

        // this.renderer.render(this._shader, uniforms, this._scene, this.getRenderFBO(context));
        if ((this._leafScene.meshes.length || this._parentScene.meshes.length) && !Object.keys(this.tilesLoading).length) {
            this.layer.fire('terrainreadyandrender');
        }
    }

    _createTerrainMesh(tileInfo, terrainGeo) {
        const { positions, texcoords, triangles, numTrianglesWithoutSkirts } = terrainGeo;
        const geo = new reshader.Geometry({
            POSITION: positions,
            TEXCOORD_0: texcoords
        },
        triangles,
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
        mesh.properties.skirtOffset = numTrianglesWithoutSkirts * 3;
        mesh.properties.skirtCount = triangles.length - numTrianglesWithoutSkirts * 3;
        mesh.properties.z = tileInfo.z;
        // mesh.properties.tileInfo = tileInfo;
        const textures = [];
        const emptyTexture = this._getEmptyTexture();
        for (let i = 0; i < skinCount; i++) {
            textures[i] = emptyTexture;
        }
        mesh.setUniform('skins', textures);
        mesh.setUniform('bias', 0);

        const map = this.getMap();
        const tileSize = this.layer.options['tileSize'];
        const terrainWidth = tileSize + 1;

        const scale = tileInfo.res / map.getGLRes();

        let terrainScale = (tileSize + 2) / terrainWidth;

        const { extent2d, offset } = tileInfo;
        vec3.set(V3, (extent2d.xmin - offset[0]) * scale, (tileInfo.extent2d.ymax - offset[1]) * scale, 0);
        const localTransform = mat4.identity([]);
        mat4.translate(localTransform, localTransform, V3);

        // terrainScale =  (tileSize + 2 * terrainScale) / (terrainWidth - 1);
        vec3.set(SCALE3, scale * terrainScale, scale * terrainScale, 1);
        mat4.scale(localTransform, localTransform, SCALE3);
        mesh.localTransform = localTransform;

        return mesh;
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
        if (!tileImage.skinStatus) {
            // 还没有初始化
            return true;
        }
        const skinCount = this.layer.getSkinCount();
        for (let i = 0; i < skinCount; i++) {
            if (!tileImage.skinStatus[i]) {
                return false;
            }
        }
        return true;
    }

    isValidCachedTile(tile) {
        if (!tile.image) {
            return false;
        }
        if (!this._isSkinReady(tile.image)) {
            return false;
        }
        return true;
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

    onTileError(data, tile)  {
        // TODO
        super.onTileError(data, tile);
    }

    _queryTerrain(out, tileIndex, worldPos, res, z) {
        const terrainData = this._findTerrainData(tileIndex.x, tileIndex.y, z, this.layer.options['backZoomOffset']);
        if (terrainData && terrainData.image && terrainData.image.data) {
            const extent2d = terrainData.info.extent2d;
            const terrainRes = terrainData.info.res;
            const scale = terrainRes / res;
            const x = worldPos.x - extent2d.xmin * scale;
            const y = extent2d.ymax * scale - worldPos.y;
            const altitude = this._queryAltitudeInHeights(terrainData.image.data, x / (extent2d.getWidth() * scale), y / (extent2d.getHeight() * scale));
            out[0] = altitude;
            out[1] = 1;
        } else {
            out[0] = null;
            out[1] = 0;
        }
        return out;
    }

    _findTerrainData(x, y, z, limit) {
        const tileId = this.layer['_getTileId'](x, y, z);
        let terrainData = this.tilesInView[tileId] || this.tileCache.get(tileId);
        if (!terrainData && limit <= 0) {
            return this._findTerrainData(Math.floor(x / 2), Math.floor(y / 2), z - 1, limit + 1);
        }
        return terrainData;
    }

    _queryAltitudeInHeights(terrainData, x, y) {
        const { width, height, data } = terrainData;
        const tx = Math.floor(width * x);
        const ty = Math.floor(height * y);
        return data[ty * width + tx];
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

        const extraCommandProps = {
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
            colorMask: (_, props) => {
                if (props['colorMask'] === false) {
                    return FALSE_COLOR_MASK;
                } else {
                    return TRUE_COLOR_MASK;
                }
            },
            stencil: {
                enable: (_, props) => {
                    return props.enableStencil;
                },
                func: {
                    cmp: () => {
                        return '<=';
                    },
                    ref: (context, props) => {
                        return props.stencilRef;
                    }
                },
                op: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: 'replace'
                }
            },
            cull: {
                enable: true,
                face: (_, props) => {
                    return props['cullFace'];
                }
            },
            depth: {
                enable: true,
                mask: (_, props) => {
                    const depthMask = this.layer.options['depthMask'];
                    return depthMask && props['depthMask'];
                },
                func: this.layer.options['depthFunc'] || '<='
                // func: (_, props) => {
                //     if (props['depthFunc']) {
                //         return props['depthFunc'];
                //     }
                //     return this.layer.options['depthFunc'] || '<=';
                // },
            },
            blend: {
                enable: true,
                func: { src: this.layer.options.blendSrc, dst: this.layer.options.blendDst },
                equation: 'add'
            },
            // polygonOffset: {
            //     factor: () => {

            //     },
            //     units: () => {

            //     }
            // }
        };

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
            extraCommandProps
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
        let heightScale = this._heightScale;
        if (!heightScale) {
            heightScale = this._heightScale = this._getPointZ(100) / 100;
        }
        const uniforms = {
            projViewMatrix,
            heightScale
        };
        return uniforms;
    }
}

export default TerrainLayerRenderer;

const SKIN_LEVEL_LIMIT = 4;

maptalks.renderer.TileLayerCanvasRenderer.include({
    renderTerrainSkin(regl, terrainLayer, terrainTileInfo, texture, tiles, parentTile) {
        const { res, extent2d, offset } = terrainTileInfo;
        const debug = terrainLayer.options['debug'];
        const debugColor = terrainLayer.options['debugOutline'];
        const ctx = texture.getContext('2d');
        if (parentTile) {
            drawTileImage(ctx, extent2d, offset, parentTile, res, debug);
        }
        for (let i = 0; i < tiles.length; i++) {
            drawTileImage(ctx, extent2d, offset, tiles[i], res, debug);
        }

        if (debug) {
            const debugInfo = terrainTileInfo.x + '/' + terrainTileInfo.y + '/' + terrainTileInfo.z;
            const { width, height } = ctx.canvas;
            drawDebug(ctx, debugInfo, debugColor, 6, 0, 0, width, height);
        }
    },

    createTerrainTexture(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
});


function drawTileImage(ctx, extent, terrainOffset, tile, res, debug) {
    const scale = tile.info.res / res;
    const { info, image } = tile;
    const offset = info.offset;
    const width = image.width * scale;
    const height = image.height * scale;
    const xmin = info.extent2d.xmin * scale;
    const ymax = info.extent2d.ymax * scale;
    const left = xmin - extent.xmin;
    const top = extent.ymax - ymax;
    const dx = terrainOffset[0] - offset[0];
    const dy = offset[1] - terrainOffset[1];
    ctx.drawImage(image, left + dx, top + dy, width, height);
    if (debug) {
        const { x, y, z } = tile.info;
        drawDebug(ctx, `${x}/${y}/${z}`, 'yellow', 1, left + dx, top + dy, width, height, -18);
    }
}

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


function terrainMeshCompare(m0, m1) {
    return m1.properties.z - m0.properties.z;
}
