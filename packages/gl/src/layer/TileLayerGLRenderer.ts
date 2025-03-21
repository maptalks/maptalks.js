import * as maptalks from 'maptalks';
import { RenderContext, Tile, TileLayer } from 'maptalks';
import * as reshader from '@maptalks/reshader.gl';
import { WebGLConstants } from '@maptalks/reshader.gl';
import { mat4 } from '@maptalks/reshader.gl';

const { TileLayerRendererable, LayerAbstractRenderer } = maptalks.renderer;

const TILE_POINT = new maptalks.Point(0, 0);
const DEFAULT_BASE_COLOR = [1, 1, 1, 1];
const positionData = new Int16Array([
    0, 0, 0, -1, 1, 0, 1, -1
]);

const texCoords = new Uint16Array([
    0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0
]);

const MESH_TO_TEST = { properties: {}};


const DEBUG_POINT = new maptalks.Point(20, 20);

class TileLayerGLRenderer2 extends TileLayerRendererable(LayerAbstractRenderer) {
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
            }
            if (!defines['HAS_DEBUG']) {
                mesh.setDefines({
                    'HAS_DEBUG': 1
                });
            }
        } else if (defines['HAS_DEBUG']) {
            mesh.setDefines({});
        }

        const minFilter = this._getTexMinFilter();

        if (mesh.properties.minFilter !== minFilter) {
            const baseColorTexture = (mesh.material.get('baseColorTexture') as any);
            baseColorTexture.setMinFilter(minFilter);
            mesh.properties.minFilter = minFilter;
        }
        const dpr = map.getDevicePixelRatio();
        const resized = map._getResolution() !== tileInfo.res;

        let magFilter: number = WebGLConstants.GL_NEAREST;
        if (dpr !== 1 || resized) {
            magFilter = WebGLConstants.GL_LINEAR;
        }
        if (mesh.properties.magFilter !== magFilter) {
            const baseColorTexture = (mesh.material.get('baseColorTexture') as any);
            baseColorTexture.setMagFilter(magFilter);
            mesh.properties.magFilter = magFilter;
        }

        const opacity = this.getTileOpacity(tileImage, tileInfo);
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
        const texture = new reshader.Texture2D({
            data: canvas,
            width: canvas.width,
            height: canvas.height
        });
        const { device, regl } = (this.context as any);
        texture.getREGLTexture(device || regl);
        return texture;
    }
    _getTexMinFilter() {
        const map = this.getMap();
        const zoom = map.getZoom();
        const blurTexture = map.isMoving() && map.getRenderer().isViewChanged();
        let minFilter;
        if (blurTexture) {
            minFilter = WebGLConstants.GL_LINEAR_MIPMAP_LINEAR;
        } else if (!map.getBearing() && !map.getPitch() && Number.isInteger(zoom)) {
            minFilter = WebGLConstants.GL_NEAREST;
        } else {
            minFilter = WebGLConstants.GL_LINEAR;
        }
        return minFilter;
    }
    _createTileMesh(tileInfo: Tile['info'], tileImage: Tile['image']): any {
        const map = this.getMap();

        const scale = tileInfo.res / map.getGLRes();
        const width = tileInfo.extent2d.xmax - tileInfo.extent2d.xmin;
        const height = tileInfo.extent2d.ymax - tileInfo.extent2d.ymin;

        const { extent2d, offset } = tileInfo;
        const point = TILE_POINT.set(extent2d.xmin - offset[0], tileInfo.extent2d.ymax - offset[1]);
        const x = point.x * scale,
            y = point.y * scale;

        const uniforms = {
            zoom: tileInfo.z,
            opacity: 1,
            debugLine: 0,
            alphaTest: 1,
            baseColor: DEFAULT_BASE_COLOR,
            baseColorTexture: new reshader.Texture2D({
                data: tileImage,
                mag: 'nearest',
                mipmap: true
            })
        };
        const material = new reshader.Material(uniforms);
        const mesh = new reshader.Mesh(this._tileGeometry, material);
        mesh.properties.minFilter = WebGLConstants.GL_NEAREST;
        const localTransform = mat4.identity([] as any);
        mat4.translate(localTransform, localTransform, [x || 0, y || 0, 0]);
        mat4.scale(localTransform, localTransform, [scale * width, scale * height, 1]);
        mesh.localTransform = localTransform;
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
        const mesh = (tile.image as any).mesh;
        if (mesh) {
            mesh.material.dispose();
            mesh.dispose();
            delete (tile.image as any).mesh;
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
