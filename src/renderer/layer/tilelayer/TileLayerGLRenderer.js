import { emptyImageUrl } from '../../../core/util';
import TileLayer from '../../../layer/tile/TileLayer';
import TileLayerCanvasRenderer from './TileLayerCanvasRenderer';
import ImageGLRenderable from '../ImageGLRenderable';

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

    drawTile(tileInfo, tileImage) {
        const map = this.getMap();
        if (!tileInfo || !map) {
            return;
        }
        if (tileImage.src === emptyImageUrl) {
            return;
        }

        const scale = map.getGLScale(tileInfo.z),
            w = tileInfo.size[0] * scale,
            h = tileInfo.size[1] * scale;
        if (tileInfo.cache !== false) {
            this._bindGLBuffer(tileImage, w, h);
        }
        if (!this._gl()) {
            // fall back to canvas 2D
            super.drawTile(tileInfo, tileImage);
            return;
        }
        const point = tileInfo.point;
        const x = point.x * scale,
            y = point.y * scale;
        const opacity = this.getTileOpacity(tileImage);
        this.drawGLImage(tileImage, x, y, w, h, opacity);

        if (opacity < 1) {
            this.setToRedraw();
        } else {
            this.setCanvasUpdated();
        }
    }

    writeZoomStencil() {
        const gl = this.gl;
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    }

    startZoomStencilTest() {
        const gl = this.gl;
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        gl.stencilFunc(gl.EQUAL, 0, 0xFF);
    }

    endZoomStencilTest() {
        this.pauseZoomStencilTest();
    }

    pauseZoomStencilTest() {
        const gl = this.gl;
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
    }

    resumeZoomStencilTest() {
        const gl = this.gl;
        gl.stencilFunc(gl.EQUAL, 0, 0xFF);
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
        return this.getMap() && !!this.getMap().getPitch() || this.layer && !!this.layer.options['fragmentShader'];
    }

    deleteTile(tile) {
        super.deleteTile(tile);
        if (tile && tile.image) {
            this.disposeImage(tile.image);
        }
    }

    onRemove() {
        this.removeGLCanvas();
    }
}

TileLayer.registerRenderer('gl', TileLayerGLRenderer);

export default TileLayerGLRenderer;


