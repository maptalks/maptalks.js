import Browser from '../core/Browser';
import ImageGLRenderable from '../renderer/layer/ImageGLRenderable';
import CanvasRenderer from '../renderer/layer/CanvasRenderer';
import Extent from '../geo/Extent';
import Coordinate from '../geo/Coordinate';
import Layer from './Layer';

/**
 * @property {Object}              options                     - Layer's options
 */
//import * as maptalks from 'maptalks';

const options = {
    renderer: Browser.webgl ? 'gl' : 'canvas',
    crossOrigin: null
};

class ImageLayer extends Layer {

    constructor(id, options = {}) {
        super(id, options);
        this._options = options;
        this._images = options.images;
        this._extent = options.extent;
    }

    onLoad() {
        if (this.imgData && this.imgData.length > 0) {
            return true;
        }
        this.imgData = [];
        const len = this._images.length;
        for (let i = 0; i < len; i++) {
            const img = new Image();
            img.src = this._images[i].url;
            img.crossOrigin = this._options.crossOrigin;
            img.onload = () => {
                this.imgData.push({
                    img:img,
                    extent:this._images[i].extent
                });
                if (i === len - 1) {
                    this.load();
                }
            };
        }
        return false;
    }

    //check whether image is in map's extent
    _isInExtent(extent) {
        const map = this.getMap();
        const mapExtent = map.getExtent();
        const intersection = mapExtent.intersection(new Extent(extent));
        if (intersection) {
            return true;
        } else
            return false;
    }
}

ImageLayer.mergeOptions(options);

class ImageCanvasRenderer extends CanvasRenderer {

    onAdd() {

    }

    needToRedraw() {
        const map = this.layer.getMap();
        if (map.isZooming()) {
            return false;
        }
        if (map.isMoving()) {
            return false;
        }
        return super.needToRedraw();
    }

    draw() {
        this.prepareCanvas();
        this._drawImages();
    }

    _drawImages() {
        if (this.layer.imgData && this.layer.imgData.length > 0) {
            for (let i = 0; i < this.layer.imgData.length; i++) {
                this._drawImage(this.layer.imgData[i]);
            }
            this.completeRender();
        }
    }

    _drawImage(imgObject) {
        const extent = new Extent(imgObject.extent);
        if (this.layer._isInExtent(extent)) {
            const imgExtent = this._buildDrawParams(extent);
            this.context.drawImage(imgObject.img, imgExtent.x, imgExtent.y, imgExtent.width, imgExtent.height);
        }
    }

    _buildDrawParams(extent) {
        const nw = new Coordinate(extent.xmin, extent.ymax);
        const se = new Coordinate(extent.xmax, extent.ymin);
        const lt = this.layer.getMap().coordinateToContainerPoint(nw);
        const rb = this.layer.getMap().coordinateToContainerPoint(se);
        const width = rb.x - lt.x;
        const height = rb.y - lt.y;
        return {
            x:lt.x,
            y:lt.y,
            width:width,
            height:height
        };
    }

    drawOnInteracting() {
        this.draw();
    }

    hitDetect() {
        return false;
    }

    onZoomEnd(e) {
        super.onZoomEnd(e);
    }

    onMoveEnd(e) {
        super.onMoveEnd(e);
    }

    onDragRotateEnd(e) {
        super.onDragRotateEnd(e);
    }

}

ImageLayer.registerRenderer('canvas', ImageCanvasRenderer);

ImageLayer.registerRenderer('gl', class extends ImageGLRenderable(ImageCanvasRenderer) {

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

    /*draw() {
        this.prepareCanvas();
        this._drawImages();
    }*/

    _drawImages() {
        if (this.layer.imgData && this.layer.imgData.length > 0) {
            for (let i = 0; i < this.layer.imgData.length; i++) {
                this._drawImage(this.layer.imgData[i]);
            }
            this.completeRender();
        }
    }

    _drawImage(imgObject) {
        const map = this.getMap(),
            glZoom = map.getGLZoom();
        const extent = new Extent(imgObject.extent);
        if (this.layer._isInExtent(extent)) {
            const nw = new Coordinate(extent.xmin, extent.ymax);
            const se = new Coordinate(extent.xmax, extent.ymin);
            const lt = map._prjToPoint(nw, glZoom);
            const rb = map._prjToPoint(se, glZoom);
            const width = rb.x - lt.x;
            const height = rb.y - lt.y;
            if (!this._gl()) {
                // fall back to canvas 2D
                super._drawImage(imgObject);
                return;
            }
            this.drawGLImage(imgObject.img, lt.x, lt.y, width, height, 1.0);
            this.setCanvasUpdated();
        }
    }

    drawOnInteracting() {
        this.draw();
    }

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
        if (this.glCanvas && this.isCanvasUpdated()) {
            const ctx = this.context;
            if (Browser.retina) {
                ctx.save();
                ctx.scale(1 / 2, 1 / 2);
            }
            // draw gl canvas on layer canvas
            ctx.drawImage(this.glCanvas, 0, 0);
            if (Browser.retina) {
                ctx.restore();
            }
        }
        return super.getCanvasImage();
    }

    // decide whether the layer is renderer with gl.
    // when map is pitching, or fragmentShader is set in options
    _gl() {
        return this.getMap() && !!this.getMap().getPitch() || this.layer && !!this.layer.options['fragmentShader'];
    }

    onRemove() {
        this.removeGLCanvas();
    }
});

export default ImageLayer;
