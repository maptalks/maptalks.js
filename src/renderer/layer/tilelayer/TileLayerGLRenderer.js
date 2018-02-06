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

        const point = tileInfo.point,
            tileZoom = tileInfo.z;
        const scale = map.getGLScale(tileZoom),
            pp = point.multi(scale);
        const x = pp.x,
            y = pp.y,
            w = tileInfo.size[0] * scale,
            h = tileInfo.size[1] * scale;
        this._bindGLBuffer(tileImage, x, y, w, h);

        if (!this._gl()) {
            // fall back to canvas 2D
            super.drawTile(tileInfo, tileImage);
            return;
        }
        const opacity = this.getTileOpacity(tileImage);
        this.drawGLImage(tileImage, x, y, w, h, opacity);

        if (opacity < 1) {
            this.setToRedraw();
        } else {
            this.setCanvasUpdated();
        }
    }

    _bindGLBuffer(image, x, y, w, h) {
        if (!image.glBuffer) {
            image.glBuffer = this.bufferTileData(x, y, w, h);
        }
    }

    loadTileImage(tileImage, url) {
        //image must set cors in webgl
        tileImage.crossOrigin = this.layer.options['crossOrigin'] || '';
        tileImage.src = url;
        return;
    }

    // prepare gl, create program, create buffers and fill unchanged data: image samplers, texture coordinates
    onCanvasCreate() {
        this.createCanvas2();
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
        if (!this._gl()) {
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
        return this.getMap() && !!this.getMap().getPitch() || this.layer && !!this.layer.options['fragmentShader'];
    }

    deleteTile(tile) {
        super.deleteTile(tile);
        if (tile && tile.image && tile.image.texture) {
            this.saveTexture(tile.image.texture);
            this.saveImageBuffer(tile.image.glBuffer);
            delete tile.image.texture;
            delete tile.image.glBuffer;
        }
    }

    onRemove() {
        this.removeGLCanvas();
    }
}

TileLayer.registerRenderer('gl', TileLayerGLRenderer);

export default TileLayerGLRenderer;


