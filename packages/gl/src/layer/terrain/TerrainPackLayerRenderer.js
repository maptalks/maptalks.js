import * as maptalks from 'maptalks';

import { createREGL } from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';
import { vec3, mat4 } from 'gl-matrix';
import vert from './glsl/terrain.vert';
import frag from './glsl/terrain.frag';
import { extend } from '../util/util';

const v3 = [0, 0, 0];
const scale3 = [];
const EMPTY_ARRAY = [];

export default class TerrainPackLayerRenderer extends maptalks.renderer.TileLayerGLRenderer {
    constructor(...args) {
        super(...args);
        this._terrainCache = new maptalks.LRUCache(this.layer.options['maxCacheSize'], this.deleteTile.bind(this));
        this._scene = new reshader.Scene();
    }

    onDrawTileStart() {}

    onDrawTileEnd() {}

    consumeTile(tileImage, tileInfo) {
        const id = tileInfo.terrainDataId;
        const terrainData = this._terrainCache.get(id);
        if (tileInfo.heights) {
            terrainData.terrainGeo = tileImage;
            if (!terrainData.mesh) {
                const mesh = this._createTerrainMesh(tileInfo, terrainData);
                terrainData.mesh = mesh;
            } else {
                this._updateMesh(terrainData, terrainData.mesh);
            }
        } else {
            // 普通的瓦片图片
            super.consumeTile(tileImage, tileInfo);
            if (terrainData && terrainData.mesh) {
                terrainData.skins[tileInfo.skinIndex] = new reshader.Texture2D({
                    data: tileImage,
                    width: tileImage.width,
                    height: tileImage.height
                }, this._resLoader);
                this._updateMesh(terrainData, terrainData.mesh);
            }
        }
    }

    loadTile(tile) {
        if (tile.heights) {
            const helper = this.layer.getTerrainHelper();
            helper.queryTileMesh(tile.heights.array, (err, data) => {
                if (err) {
                    this.onTileError(err, tile);
                    return;
                }
                this.onTileLoad(data, tile);
            });
            return {};
        } else {
            return super.loadTile(tile);
        }
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
        const  { terrainDataId } = tileInfo;
        const terrainData = this._terrainCache.get(terrainDataId);
        if (terrainData.mesh) {
            this._scene.addMesh(terrainData.mesh);
        }
    }

    _endFrame(context) {
        const uniforms = this._getUniformValues();
        this.renderer.render(this._shader, uniforms, this._scene, this.getRenderFBO(context));
    }

    _createTerrainMesh(tileInfo, terrainData) {
        // create mesh
        if (!tileInfo || !terrainData) {
            return;
        }
        const { skins, terrainGeo } = terrainData;
        const { terrain } = terrainGeo;
        const geo = new reshader.Geometry({
            POSITION: terrain.positions,
            TEXCOORD_0: terrain.texcoords
        },
        terrain.triangles,
        0,
        {
            primitive: 'triangles',
            positionAttribute: 'POSITION',
            uv0Attribute: 'TEXCOORD_0'
        });

        const textures = skins.map(t => {
            if (t.destroy) {
                return t;
            }
            return new reshader.Texture2D({
                data: t.image,
                width: t.width,
                height: t.height
            }, this._resLoader);
        })
        const uniforms = {
            skins: textures
        };
        const material = new reshader.Material(uniforms);
        const mesh = new reshader.Mesh(geo, material);
        mesh.setDefines({
            'SKIN_COUNT': skins.length
        });

        const map = this.getMap();
        const scale = tileInfo._glScale = tileInfo._glScale || map.getGLScale(tileInfo.z);

        const { extent2d, offset } = tileInfo;
        v3[0] = (extent2d.xmin - offset[0]) * scale;
        v3[1] = (tileInfo.extent2d.ymax - offset[1]) * scale;
        const localTransform = mat4.identity([]);
        mat4.translate(localTransform, localTransform, v3);
        vec3.set(scale3, scale, scale, 1);
        mat4.scale(localTransform, localTransform, scale3);
        mesh.localTransform = localTransform;

        mesh.properties.skins = skins.slice(0);
        mesh.properties.terranData = terrainData;
        return mesh;
    }

    _updateMesh(tileImage, mesh) {
        const { terrainData, skins } = tileImage;
        if (terrainData.dirty) {
            mesh.updateData('POSITION', terrainData.positions);
            mesh.updateData('TEXCOORD_0', terrainData.texcoords);
            mesh.setElements(terrainData.triangles);
            terrainData.dirty = false;
        }
        const material = mesh.material;
        const textures = material.get('skins');
        let updated = false;
        for (let i = 0; i < skins.length; i++) {
            if (mesh.properties.skins[i] !== skins[i]) {
                updated = true;
                textures[i] = new reshader.Texture2D({
                    data: skins[i].image,
                    width: skins[i].width,
                    height: skins[i].height
                }, this._resLoader);
            }
        }
        if (updated) {
            material.set('skins', textures);
        }
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
            parentTiles = [], parentKeys = {};
        const childTiles = EMPTY_ARRAY;
        const placeholders = EMPTY_ARRAY;
        //visit all the tiles
        const tileQueue = {};
        const preLoadingCount = this['_markTiles'](),
            loadingLimit = this['_getLoadLimit']();

        const gridCount = tileGrids.length;

        // main tile grid is the last one (draws on top)
        this['_tileZoom'] = tileGrids[0]['zoom'];

        const tileGrid = tileGrids[0];
        const allTiles = tileGrid['tiles'];


        for (let i = 0, l = allTiles.length; i < l; i++) {
            const tile = allTiles[i];
            const terrainDataId = this._getTerrainDataId(tile.x, tile.y, tile.z);
            let terrainData = this._getCachedTerrainTile(terrainDataId);
            if (isTerrainComplete(terrainData)) {
                tiles.push(terrainData);
                continue;
            } else {
                const key = 'terrain_' + terrainDataId;
                terrainData = terrainData || {
                    skins: []
                };
                // 从helper中获取瓦片范围内
                if (!terrainData.heights || !terrainData.heights.complete) {
                    terrainData.heights = this.layer.getTerrainHelper().queryTileAltitude(terrainData.terrain, tile);
                    if (terrainData.heights.dirty) {
                        tileQueue[key] = {
                            terrainDataId: terrainDataId,
                            heights: terrainData.heights,
                        };
                        extend(tileQueue[key], tile);
                        terrainData.heights.dirty = false;
                    }
                }
                this._terrainCache.add(terrainDataId, terrainData);
            }
            tiles.push({
                info: tile,
                image: terrainData
            });
            for (let j = 0; j < gridCount; j++) {
                const tile = tileGrids[j].tiles[i];
                const tileId = tile['id'];
                if (!tile.terrainDataId) {
                    tile.terrainDataId = terrainDataId;
                    tile.skinIndex = j;
                }
                let tileLoading = false;
                if (this._isLoadingTile(tileId)) {
                    tileLoading = loading = true;
                    this.tilesLoading[tileId].current = true;
                } else {
                    const cached = this._getCachedTile(tileId);
                    if (cached) {
                        terrainData.skins[j] = cached;
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
                    }
                } else {
                    terrainData.skins[j] = this._getEmptyTexture();
                }
            }
            //load tile in cache at first if it has.
        }

        return {
            parentTiles, tiles, loading, loadingCount, tileQueue, childTiles, placeholders
        };
    }

    _getTerrainDataId(x, y, z) {
        const terrainHelper = this.layer.getTerrainHelper();
        return terrainHelper['_getTileId'](x, y, z);
    }

    _getEmptyTexture() {
        return this._emptyTileTexture;
    }

    _getCachedTerrainTile(tileId) {
        return this._terrainCache.get(tileId);
    }

    // prepare gl, create program, create buffers and fill unchanged data: image samplers, texture coordinates
    onCanvasCreate() {
        //not in a GroupGLLayer
        if (!this.canvas.gl || !this.canvas.gl.wrap) {
            this.createCanvas2();
        }
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

    deleteTile(tile) {
        super.deleteTile(tile);
        if (tile && tile.image) {
            this.disposeImage(tile.image);
        }
        delete tile.image;
    }

    onRemove() {
        super.onRemove();
        if (this._emptyTileTexture) {
            this._emptyTileTexture.destroy();
            delete this._emptyTileTexture;
        }
        this.removeGLCanvas();
    }

    _initShader() {
        this.renderer = new reshader.Renderer(this.regl);
        const map = this.layer.getMap();
        this._uniforms = {
            'projViewMatrix' : map.projViewMatrix
        };

        this._shader = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
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
}

function isTerrainComplete(terrainData) {
    if (!terrainData || !terrainData.terrain || !terrainData.heights || !terrainData.heights.complete) {
        return false;
    }
    const skins = terrainData.skins;
    for (let i = 0; i < skins.length; i++) {
        if (!skins[i] || !skins[i].info) {
            return false;
        }
    }
    return true;
}
