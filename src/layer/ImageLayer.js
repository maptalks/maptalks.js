import Layer from './Layer';
import CanvasRenderer from 'renderer/layer/CanvasRenderer';
import ImageGLRenderable from 'renderer/layer/ImageGLRenderable';
import browser from 'core/Browser';
import Extent from 'geo/Extent';
import Coordinate from 'geo/Coordinate';

const options = {
    renderer: browser.webgl ? 'gl' : 'canvas',
    crossOrigin: null
};

class ImageLayer extends Layer {

    constructor(id, options = {}) {
        super(id, options);
        this._options = options;
    }

    onLoad() {
        if (this.images) {
            return true;
        }
        this.images = this._options.images;
        this.load();
        return false;
    }

    addImage(imageObject) {
        const img = new Image();
        img.onload = () => {
            const renderer = this._getRenderer();
            const imgObject = { img: img, extent: imageObject.extent };
            renderer._drawImage(imgObject);
            this._imageData.push(imgObject);
            renderer.completeRender();
        };
        img.src = imageObject.url;
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
        const images = this.layer.images;
        if (images && images.length > 0) {
            if (!this.layer._imageData) {
                this.layer._imageData = [];
                const len = images.length;
                for (let i = 0; i < len; i++) {
                    const img = new Image();
                    img.src = images[i].url;
                    img.crossOrigin = this.layer._options.crossOrigin;
                    const extent = images[i].extent;
                    img.onload = () => {
                        const imgObject = { img: img, extent: extent };
                        this._drawImage(imgObject);
                        this.layer._imageData.push(imgObject);
                        this.completeRender();
                    };
                    img.onerror = () => {
                        this.completeRender();
                    };
                }
            } else {
                for (let j = 0; j < this.layer._imageData.length; j++) {
                    this._drawImage(this.layer._imageData[j]);
                }
                this.completeRender();
            }
        }
    }

    _drawImage(imgObject) {
        const _extent = new Extent(imgObject.extent);
        if (this.layer._isInExtent(_extent)) {
            const imgExtent = this._buildDrawParams(_extent);
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
        if (map.isZooming()) {
            return true;
        }
        if (map.isMoving()) {
            return true;
        }
        if (map.isRotating()) {
            return true;
        }
        return super.needToRedraw();
    }

    draw() {
        this.prepareCanvas();
        this._drawImages();
    }

    _drawImages() {
        const images = this.layer.images;
        if (images && images.length > 0) {
            if (!this.layer._imageData) {
                this.layer._imageData = [];
                const len = images.length;
                for (let i = 0; i < len; i++) {
                    const img = new Image();
                    img.src = images[i].url;
                    img.crossOrigin = this.layer._options.crossOrigin;
                    const extent = images[i].extent;
                    img.onload = () => {
                        const imgObject = { img: img, extent: extent };
                        this._drawImage(imgObject);
                        this.layer._imageData.push(imgObject);
                        this.completeRender();
                    };
                    img.onerror = () => {
                        this.completeRender();
                    };
                }
            } else {
                for (let j = 0; j < this.layer._imageData.length; j++) {
                    this._drawImage(this.layer._imageData[j]);
                }
                this.completeRender();
            }
        }
    }

    _drawImage(imgObject) {
        const map = this.getMap(),
            glZoom = map.getGLZoom();
        const extent = new Extent(imgObject.extent);
        if (this.layer._isInExtent(extent)) {
            const nw = new Coordinate(extent.xmin, extent.ymax);
            const se = new Coordinate(extent.xmax, extent.ymin);
            const lt = this.layer.getMap()._prjToPoint(nw, glZoom);
            const rb = this.layer.getMap()._prjToPoint(se, glZoom);
            const width = rb.x - lt.x;
            const height = rb.y - lt.y;
            this.drawGLImage(imgObject.img, lt.x, lt.y, width, height, 1.0);
        }
    }

    drawOnInteracting() {
        this.draw();
    }

    onCanvasCreate() {
        this.prepareGLCanvas();
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
            if (browser.retina) {
                ctx.save();
                ctx.scale(1 / 2, 1 / 2);
            }
            // draw gl canvas on layer canvas
            ctx.drawImage(this.glCanvas, 0, 0);
            if (browser.retina) {
                ctx.restore();
            }
        }
        return super.getCanvasImage();
    }

    onRemove() {
        this.removeGLCanvas();
    }
});

export default ImageLayer;
