import * as maptalks from 'maptalks';
import { RenderContext, Tile, TileLayer } from 'maptalks';
import * as reshader from '../reshader';
import TexturePoolable from './TexturePoolable';
import { createImageMesh, updateFilter } from './util/imageMesh';
import { isNil } from './util/util';
import CanvasCompatible from './CanvasCompatible';

const { TileLayerRendererable, LayerAbstractRenderer } = maptalks.renderer;

const positionData = new Int16Array([
    0, 0, 0, -1, 1, 0, 1, -1
]);

const texCoords = new Uint16Array([
    0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0
]);

const MESH_TO_TEST = { properties: {}};


const DEBUG_POINT = new maptalks.Point(20, 20);

class TileLayerGLRenderer2 extends TexturePoolable(CanvasCompatible(TileLayerRendererable(LayerAbstractRenderer))) {
    //@internal
    _tileGeometry: reshader.Geometry;
    //@internal
    _shader: reshader.ImageShader;
    //@internal
    _tileScene: reshader.Scene;
    //@internal
    _tileMeshes: reshader.Mesh[];
    //@internal
    _renderer: reshader.Renderer;
    _debugInfoCanvas: HTMLCanvasElement;

    constructor(layer: TileLayer) {
        super(layer);
        this.init();
    }

    onResize(param: any): void {
        super.onResize(param);
        this.resizeCanvas();
    }

    onDrawTileStart(context, parentContext: RenderContext) {
        if (!this._tileGeometry) {
            this._shader = new reshader.ImageShader({
                extraCommandProps: this._getCommandProps()
            });
            this._tileGeometry = new reshader.Geometry(
                {
                    aPosition: positionData,
                    aTexCoord: texCoords
                },
                4,
                0,
                {
                    positionSize: 2,
                    primitive: 'triangle strip'
                }
            );
            const { regl, device } = this.context as any;
            this._tileGeometry.generateBuffers(regl || device);
            this._tileMeshes = [];
            this._tileScene = new reshader.Scene(this._tileMeshes);
            this._renderer = new reshader.Renderer(regl || device);
        }
        this._tileMeshes.length = 0;
        this.clearStencil(parentContext);
    }

    clearStencil(parentContext: RenderContext) {
        let fbo;
        if (parentContext && parentContext.renderTarget) {
            fbo = parentContext.renderTarget.fbo;
        }
        const { regl, device } = this.context as any;
        (regl || device).clear({
            stencil: 0xFF,
            fbo
        });
    }

    onDrawTileEnd(context, parentContext: RenderContext) {
        const uniformValues = this._getUniformValues();
        let fbo;
        if (parentContext && parentContext.renderTarget) {
            fbo = parentContext.renderTarget.fbo;
        }
        this._tileScene.setMeshes(this._tileMeshes);
        this._renderer.render(this._shader, uniformValues, this._tileScene, fbo);
    }

    _getUniformValues() {
        const map = this.getMap();
        return {
            'projViewMatrix': map.projViewMatrix
        };
    }

    consumeTile(tileImage: Tile['image'], tileInfo: Tile['info']) {
        let mesh: reshader.Mesh = (tileImage as any).mesh;
        if (!mesh) {
            mesh = this._createTileMesh(tileInfo, tileImage);
            (tileImage as any).mesh = mesh;
        }
        return super.consumeTile(tileImage, tileInfo);
    }

    drawTile(tileInfo: Tile['info'], tileImage: Tile['image'], parentContext: RenderContext): void {
        if (parentContext && parentContext.sceneFilter) {
            if (!parentContext.sceneFilter(MESH_TO_TEST)) {
                return;
            }
        }
        const map = this.getMap();
        if (!tileInfo || !map || !tileImage) {
            return;
        }
        let mesh: reshader.Mesh = (tileImage as any).mesh;
        if (!mesh) {
            mesh = this._createTileMesh(tileInfo, tileImage);
            (tileImage as any).mesh = mesh;
        }

        const defines = mesh.getDefines();
        if (this.layer.options['debug']) {
            let debugTexture = mesh.material.get('debugTexture');
            if (!debugTexture) {
                debugTexture = this._createDebugTexture(tileInfo, tileImage.width, tileImage.height);
                mesh.material.set('debugTexture', debugTexture);
                (tileImage as any).debugTexture = debugTexture;
            }
            if (!defines['HAS_DEBUG']) {
                mesh.setDefines({
                    'HAS_DEBUG': 1
                });
            }
        } else if (defines['HAS_DEBUG']) {
            mesh.setDefines({});
        }

        updateFilter(mesh, map, tileInfo.res);

        let opacity = this.getTileOpacity(tileImage, tileInfo);
        let layerOpacity = this.layer.options['opacity'];
        if (isNil(layerOpacity)) {
            layerOpacity = 1;
        }
        opacity *= layerOpacity;


        mesh.material.set('opacity', opacity);
        mesh.setUniform('isCurrentTiles', +!!this.drawingCurrentTiles);
        this._tileMeshes.push(mesh);
        if ((this as any).getTileFadingOpacity(tileImage) < 1) {
            this.setToRedraw();
        }
    }

    _createDebugTexture(tileInfo: Tile['info'], width, height) {
        const debugInfo = this.getDebugInfo(tileInfo.id);
        const dpr = this.getMap().getDevicePixelRatio() > 1 ? 2 : 1;
        const canvas = this._debugInfoCanvas = document.createElement('canvas');
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.font = '20px monospace';
        ctx.scale(dpr, dpr);
        const color = this.layer.options['debugOutline'];
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.fillText(debugInfo, 20, height - 12);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.lineTo(0, 0);
        ctx.stroke();
        const config = {
            data: canvas,
            width: canvas.width,
            height: canvas.height
        };
        let texture = this.getTexture();
        if (!texture) {
            texture = new reshader.Texture2D(config);
        } else {
            texture.setConfig(config);
        }
        const { device, regl } = (this.context as any);
        texture.getREGLTexture(device || regl);
        return texture;
    }

    _createTileMesh(tileInfo: Tile['info'], tileImage: Tile['image']): any {
        const map = this.getMap();

        const scale = tileInfo.res / map.getGLRes();
        const uniforms = {
            zoom: tileInfo.z,
        };
        const mesh = createImageMesh.call(this, this._tileGeometry, tileImage, tileInfo.extent2d, tileInfo.offset, scale, uniforms);
        const texture = mesh.material.get('baseColorTexture') as reshader.Texture2D;
        (tileImage as any).texture = texture;
        return mesh;
    }

    loadTileImage(tileImage: HTMLImageElement, url: string) {
        // image must set cors in webgl
        const crossOrigin = this.layer.options['crossOrigin'];
        tileImage.crossOrigin = crossOrigin !== null ? crossOrigin : '';
        tileImage.src = url;
        return;
    }

    deleteTile(tile: Tile) {
        if (!tile || !tile.image) {
            return super.deleteTile(tile);
        }
        const image = tile.image as any;
        if (image.texture) {
            this.saveTexture(image.texture as any);
        }
        if (image.debugTexture) {
            this.saveTexture(image.debugTexture as any);
        }
        delete image.texture;
        delete image.debugTexture;
        const mesh = image.mesh;
        if (mesh) {
            // 因为meterial中的texture是在TexturePoolable中集中管理的，不能在material.dispose中销毁
            mesh.material.set('baseColorTexture', null, false);
            mesh.material.set('debugTexture', null, false);
            mesh.material.dispose();
            mesh.dispose();
            delete image.mesh;
        }
        return super.deleteTile(tile);
    }

    onRemove(): void {
        if (this._tileGeometry) {
            this._shader.dispose();
            this._tileGeometry.dispose();
            delete this._shader;
            delete this._tileGeometry;
            delete this._renderer;
            delete this._tileScene;
            delete this._tileMeshes;
        }
        this.disposeTexturePool();
        super.onRemove();
    }

    _getCommandProps() {
        const canvas = this.getMap().getRenderer().canvas;
        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return canvas ? canvas.width : 1;
            },
            height: () => {
                return canvas ? canvas.height : 1;
            }
        };
        const offsetFactor = {
            units: 0,
            factor: 0
        };
        return {
            stencil: {
                enable: true,
                func: {
                    cmp: '<=',
                    ref: (_, props) => {
                        const ref = Math.abs(this.getCurrentTileZoom() - props.zoom);
                        return ref;
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
                func: '<='
            },
            blend: {
                enable: true,
                func: {
                    src: 1,
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            viewport,
            polygonOffset: {
                enable: true,
                offset: (_, props) => {
                    let polygonOffset = this.layer.getPolygonOffset();
                    polygonOffset = props.isCurrentTiles ? polygonOffset : polygonOffset + 1;
                    offsetFactor.factor = polygonOffset;
                    offsetFactor.units = polygonOffset;
                    return offsetFactor;
                }
            }
        }
    }

    renderTerrainSkin(regl, terrainLayer, skinImages) {
        const tileSize = this.layer.getTileSize().width;
        const debug = terrainLayer.options['debug'];
        for (let i = 0; i < skinImages.length; i++) {
            const { tile, texture } = skinImages[i];
            if (!tile.image) {
                continue;
            }
            const canvas = document.createElement('canvas');
            skinImages[i].canvas = canvas;
            canvas.width = tileSize;
            canvas.height = tileSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(tile.image, 0, 0);
            if (debug) {
                const { x, y, z } = tile.info;
                drawDebug(ctx, `${x}/${y}/${z}`, 'yellow', 1, 0, 0, tileSize, tileSize, -18);
            }
            const config = {
                data: canvas,
                width: tileSize,
                height: tileSize,
                flipY: true,
                min: 'linear mipmap linear',
                mag: 'linear'
            };
            if (texture.update) {
                //webgpu
                texture.update(config);
            } else {
                //webgl
                texture(config);
            }

        }
    }

    createTerrainTexture(regl) {
        const tileSize = this.layer.getTileSize().width;
        const config = {
            width: tileSize,
            height: tileSize,
            flipY: true,
            min: 'linear mipmap linear',
            mag: 'linear',
            depthStencil: false,
            depth: false,
            stencil: false
        };
        return regl.texture(config);
    }

    deleteTerrainTexture(texture) {
        texture.destroy();
    }

    clear() {
        this.clearTileCaches();
        super.clear();
    }
}

maptalks.TileLayer.registerRenderer<typeof TileLayerGLRenderer2>('gl', TileLayerGLRenderer2);

export default TileLayerGLRenderer2;


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
