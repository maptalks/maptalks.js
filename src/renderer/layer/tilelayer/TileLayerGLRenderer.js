import {
    isNil
} from '../../../core/util';
import TileLayer from '../../../layer/tile/TileLayer';
import TileLayerCanvasRenderer from './TileLayerCanvasRenderer';
import ImageGLRenderable from '../ImageGLRenderable';
import Point from '../../../geo/Point';


const TILE_POINT = new Point(0, 0);

const MESH_TO_TEST = { properties: {}};

/**
 * @classdesc
 * Renderer class based on HTML5 WebGL for TileLayers
 * @class
 * @protected
 * @memberOf renderer
 * @extends {renderer.TileLayerCanvasRenderer}
 * @param {TileLayer} layer - TileLayer to render
 */
class TileLayerGLRenderer extends ImageGLRenderable(TileLayerCanvasRenderer) {

    //override to set to always drawable
    isDrawable() {
        return true;
    }

    needToRedraw() {
        const map = this.getMap();
        if (this._gl() && !map.getPitch() && map.isZooming() && !map.isMoving() && !map.isRotating()) {
            return true;
        }
        return super.needToRedraw();
    }

    onDrawTileStart(context, parentContext) {
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.enable(gl.STENCIL_TEST);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

        const depthMask = isNil(this.layer.options['depthMask']) || !!this.layer.options['depthMask'];
        gl.depthMask(depthMask);
        if (parentContext && parentContext.renderTarget) {
            const fbo = parentContext.renderTarget.fbo;
            if (fbo) {
                const framebuffer = parentContext.renderTarget.getFramebuffer(fbo);
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            }
        }
    }

    onDrawTileEnd(context, parentContext) {
        const gl = this.gl;
        if (parentContext && parentContext.renderTarget) {
            const fbo = parentContext.renderTarget.fbo;
            if (fbo) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
        }
    }

    drawTile(tileInfo, tileImage, parentContext) {
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
        if (!this._gl()) {
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

        this.drawGLImage(tileImage, x, y, w, h, scale, opacity, debugInfo);
        if (this._getTileFadingOpacity(tileImage) < 1) {
            this.setToRedraw();
        } else {
            this.setCanvasUpdated();
        }
    }

    _bindGLBuffer(image, w, h) {
        if (!image.glBuffer) {
            image.glBuffer = this.bufferTileData(0, 0, w, h);
        }
    }

    loadTileImage(tileImage, url) {
        //image must set cors in webgl
        const crossOrigin = this.layer.options['crossOrigin'];
        tileImage.crossOrigin = crossOrigin !== null ? crossOrigin : '';
        tileImage.src = url;
        return;
    }

    // prepare gl, create program, create buffers and fill unchanged data: image samplers, texture coordinates
    onCanvasCreate() {
        //not in a GroupGLLayer
        if (!this.canvas.gl || !this.canvas.gl.wrap) {
            this.createCanvas2();
        }
    }

    createContext() {
        super.createContext();
        this.createGLContext();
    }

    resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        super.resizeCanvas(canvasSize);
        this.resizeGLCanvas();
    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }
        super.clearCanvas();
        this.clearGLCanvas();
    }

    getCanvasImage() {
        if (!this._gl() || !this.canvas2) {
            return super.getCanvasImage();
        }
        const img = super.getCanvasImage();
        if (img) {
            img.image = this.canvas2;
        }
        return img;
    }

    // decide whether the layer is renderer with gl.
    // when map is pitching, or fragmentShader is set in options
    _gl() {
        if (this.canvas.gl && this.canvas.gl.wrap) {
            //in GroupGLLayer
            return true;
        }
        const map = this.getMap();
        return map && (map.getPitch() || map.getBearing()) || this.layer && !!this.layer.options['fragmentShader'];
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
        this.removeGLCanvas();
    }
}

TileLayer.registerRenderer('gl', TileLayerGLRenderer);

export default TileLayerGLRenderer;

