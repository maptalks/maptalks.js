import Layer from './Layer';
import CanvasRenderer from 'renderer/layer/CanvasRenderer';
import ImageGLRenderable from 'renderer/layer/ImageGLRenderable';
import browser from 'core/Browser';
import Extent from 'geo/Extent';
import Coordinate from 'geo/Coordinate';

/**
 * @property {Object}              options                     - ImageLayer's options
 * @property {Array|Function}      options.images              - ImageLayer's image collection, it includs each image's url and extent. An image's extent should like [xmin,ymin,xmax,ymax]
 * @property {String}              [options.crossOrigin=null]    - image's corssOrigin
 * @property {String}              [options.renderer=gl]         - TileLayer's renderer, canvas or gl. gl tiles requires image CORS that canvas doesn't. canvas tiles can't pitch.
 * @memberOf ImageLayer
 * @instance
 */
const options = {
    renderer: browser.webgl ? 'gl' : 'canvas',
    crossOrigin: null
};

/**
 * @classdesc
 * A layer used to display simple images. Sometimes,we need only scan images in a simple scene,such as
 * indoor map or game map.Therefor this layer can help you display images both in geographical map and in simple map.
 * @category layer
 * @extends Layer
 * @param {String|Number} id - image layer's id
 * @param {Object} [options=null] - options defined in [ImageLayer]{@link ImageLayer#options}
 * @example
 * new ImageLayer("imagelayer",{
        images: [
                    {
                        url: 'foo1.jpg',
                        extent: [0, 0, 790 * 1.5, 339 * 1.5]
                    },
                    {
                        url: 'foo2.png',
                        extent: [100, 100, 2315 * 0.6, 2315 * 0.6]
                    }
                ],
        renderer: 'gl',
        crossOrigin: 'anonymous'
    })
 */
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

    /**
     * Add a new image to the layer
     * @param {Object} imageObject - {url:'foo.jpg', extent:[0,0,100,100]}
     * @return {ImageLayer} this
     */
    addImage(imageObject) {
        const img = new Image();
        img.onload = () => {
            const renderer = this._getRenderer();
            const imgObject = { img: img, extent: imageObject.extent };
            renderer._drawImage(imgObject);
            this._imageData.push(imgObject);
            renderer.completeRender();
        };
        this.fire('add');
        img.src = imageObject.url;
        return this;
    }

    /**
     * Clear the layer
     * @return {ImageLayer} this
     */
    clear() {
        const renderer = this._getRenderer();
        if (renderer) {
            renderer.clear();
        }
        this._imageData = [];
        this.fire('clear');
        return this;
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
