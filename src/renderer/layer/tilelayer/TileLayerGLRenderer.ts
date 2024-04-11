import TileLayer from '../../../layer/tile/TileLayer';
import TileLayerCanvasRenderer from './TileLayerCanvasRenderer';
import type { Tile, RenderContext} from './TileLayerCanvasRenderer';
import ImageGLRenderable from '../ImageGLRenderable';
import Point from '../../../geo/Point';
import { SizeLike } from '../../../geo/Size';

const TILE_POINT = new Point(0, 0);

const MESH_TO_TEST = { properties: {}};

/**
 * 基于 HTML5 WebGL 的 TileLayers 渲染器
 *
 * @english
 * Renderer class based on HTML5 WebGL for TileLayers
 * @class
 * @protected
 * @group renderer
 * @extends {renderer.TileLayerCanvasRenderer}
 * @param layer - TileLayer to render
 */
class TileLayerGLRenderer extends ImageGLRenderable(TileLayerCanvasRenderer) {

    //override to set to always drawable
    isDrawable(): boolean {
        return true;
    }

    needToRedraw(): boolean {
        const map = this.getMap();
        if (this.isGL() && !map.getPitch() && map.isZooming() && !map.isMoving() && !map.isRotating()) {
            return true;
        }
        return super.needToRedraw();
    }

    onDrawTileStart(context: RenderContext, parentContext: RenderContext): void {
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.enable(gl.STENCIL_TEST);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

        const depthMask = !!this.layer.options['depthMask'];
        gl.depthMask(depthMask);
        if (parentContext && parentContext.renderTarget) {
            const fbo = parentContext.renderTarget.fbo;
            if (fbo) {
                const framebuffer = parentContext.renderTarget.getFramebuffer(fbo);
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            }
        }
    }

    onDrawTileEnd(context: RenderContext, parentContext: RenderContext): void {
        const gl = this.gl;
        if (parentContext && parentContext.renderTarget) {
            const fbo = parentContext.renderTarget.fbo;
            if (fbo) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
        }
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

        const scale = tileInfo._glScale = tileInfo._glScale || tileInfo.res / map.getGLRes();
        const w = tileInfo.extent2d.xmax - tileInfo.extent2d.xmin;
        const h = tileInfo.extent2d.ymax - tileInfo.extent2d.ymin;
        if (tileInfo.cache !== false) {
            this._bindGLBuffer(tileImage, w, h);
        }
        if (!this.isGL()) {
            // fall back to canvas 2D, which is faster
            super.drawTile(tileInfo, tileImage);
            return;
        }
        const { extent2d, offset } = tileInfo;
        const point = TILE_POINT.set(extent2d.xmin - offset[0], tileInfo.extent2d.ymax - offset[1]);
        const x = point.x * scale,
            y = point.y * scale;
        const opacity = this.getTileOpacity(tileImage, tileInfo);
        let debugInfo = null;
        if (this.layer.options['debug']) {
            debugInfo =  this.getDebugInfo(tileInfo.id);
        }
        const gl = this.gl;
        gl.stencilFunc(gl.LEQUAL, Math.abs(this.getCurrentTileZoom() - tileInfo.z), 0xFF);
        const layerPolygonOffset = this.layer.getPolygonOffset();
        const polygonOffset = this.drawingCurrentTiles ? layerPolygonOffset : layerPolygonOffset + 1;
        gl.polygonOffset(polygonOffset, polygonOffset);

        this.drawGLImage(tileImage as any, x, y, w, h, scale, opacity, debugInfo);
        if (this._getTileFadingOpacity(tileImage) < 1) {
            this.setToRedraw();
        } else {
            this.setCanvasUpdated();
        }
    }

    _bindGLBuffer(image: Tile['image'], w: number, h: number): void {
        if (!image.glBuffer) {
            image.glBuffer = this.bufferTileData(0, 0, w, h);
        }
    }

    loadTileImage(tileImage: HTMLImageElement, url: string) {
        // image must set cors in webgl
        const crossOrigin = this.layer.options['crossOrigin'];
        tileImage.crossOrigin = crossOrigin !== null ? crossOrigin : '';
        tileImage.src = url;
        return;
    }

    /**
     * prepare gl, create program, create buffers and fill unchanged data: image samplers, texture coordinates
     */
    onCanvasCreate() {
        //not in a GroupGLLayer
        if (!this.canvas.gl || !this.canvas.gl.wrap) {
            this.createCanvas2();
        }
    }

    createContext(): void {
        super.createContext();
        this.createGLContext();
    }

    resizeCanvas(canvasSize: SizeLike) {
        if (!this.canvas) {
            return;
        }
        super.resizeCanvas(canvasSize);
        this.resizeGLCanvas();
    }

    clearCanvas(): void {
        if (!this.canvas) {
            return;
        }
        super.clearCanvas();
        this.clearGLCanvas();
    }

    getCanvasImage() {
        if (!this.isGL() || !this.canvas2) {
            return super.getCanvasImage();
        }
        const img = super.getCanvasImage();
        if (img) {
            img.image = this.canvas2;
        }
        return img;
    }

    /**
     * decide whether the layer is renderer with gl.
     * when map is pitching, or fragmentShader is set in options
     */
    isGL(): boolean {
        if (this.canvas.gl && this.canvas.gl.wrap) {
            //in GroupGLLayer
            return true;
        }
        const map = this.getMap();
        return <boolean>(map && (map.getPitch() || map.getBearing()) || this.layer && !!this.layer.options['fragmentShader']);
    }

    deleteTile(tile: Tile) {
        super.deleteTile(tile);
        if (tile && tile.image) {
            this.disposeImage(tile.image as any);
        }
        delete tile.image;
    }

    onRemove(): void {
        super.onRemove();
        this.removeGLCanvas();
    }
}

TileLayer.registerRenderer<typeof TileLayerGLRenderer>('gl', TileLayerGLRenderer);

export default TileLayerGLRenderer;

