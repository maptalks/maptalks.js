import * as maptalks from 'maptalks';
import { RenderContext, Tile } from 'maptalks';
import * as reshader from '@maptalks/reshader.gl';
import { mat4 } from '@maptalks/reshader.gl';

const { TileLayerCanvasRenderer } = maptalks.renderer;

const TEXTURE_MIN_FILTER = 10241;
const TILE_POINT = new maptalks.Point(0, 0);
const DEFAULT_BASE_COLOR = [1, 1, 1, 1];
const positionData = new Int8Array([
    0, 0, 0, -1, 1, 0, 1, -1
]);

const texCoords = new Uint8Array([
    0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0
]);

const MESH_TO_TEST = { properties: {}};

class TileLayerGLRenderer extends TileLayerCanvasRenderer {
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
            const { regl } = this.context as any;
            this._tileGeometry.generateBuffers(regl);
            this._tileMeshes = [];
            this._tileScene = new reshader.Scene(this._tileMeshes);
            this._renderer = new reshader.Renderer(regl);
        }
        this._tileMeshes.length = 0;
        this.clearStencil(parentContext);
    }

    clearStencil(parentContext: RenderContext) {
        let fbo;
        if (parentContext && parentContext.renderTarget) {
            fbo = parentContext.renderTarget.fbo;
        }
        const { regl } = this.context as any;
        regl.clear({
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
            baseColorTexture.texParameteri(TEXTURE_MIN_FILTER, minFilter);
            mesh.properties.minFilter = minFilter;
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
        texture.getREGLTexture((this.context as any).regl);
        return texture;
    }
    _getTexMinFilter() {
        const map = this.getMap();
        const zoom = map.getZoom();
        const blurTexture = map.isMoving() && map.getRenderer().isViewChanged();
        const { gl } = this.context as any;
        let minFilter;
        if (blurTexture) {
            minFilter = gl.LINEAR_MIPMAP_LINEAR;
        } else if (!map.getBearing() && !map.getPitch() && Number.isInteger(zoom)) {
            minFilter = gl.NEAREST;
        } else {
            minFilter = gl.LINEAR;
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
                mag: 'linear',
                mipmap: true
            })
        };
        const material = new reshader.Material(uniforms);
        const mesh = new reshader.Mesh(this._tileGeometry, material);
        const { gl } = this.context as any;
        mesh.properties.minFilter = gl.NEAREST;
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
}

maptalks.TileLayer.registerRenderer<typeof TileLayerGLRenderer>('gl', TileLayerGLRenderer);

export default TileLayerGLRenderer;
