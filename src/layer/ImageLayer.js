import { extend } from '../core/util';
import Browser from '../core/Browser';
import ImageGLRenderable from '../renderer/layer/ImageGLRenderable';
import CanvasRenderer from '../renderer/layer/CanvasRenderer';
import { ResourceCache } from '../renderer/layer/CanvasRenderer';
import Extent from '../geo/Extent';
import Layer from './Layer';

/**
 * @property {Object}              options                     - ImageLayer's options
 * @property {String}              [options.crossOrigin=null]    - image's corssOrigin
 * @property {String}              [options.renderer=gl]         - ImageLayer's renderer, canvas or gl. gl tiles requires image CORS that canvas doesn't. canvas tiles can't pitch.
 * @memberOf ImageLayer
 * @instance
 */
const options = {
    renderer: Browser.webgl ? 'gl' : 'canvas',
    crossOrigin: null
};

/**
 * @classdesc
 * A layer used to display images, you can specify each image's geographic extent and opacity
 * @category layer
 * @extends Layer
 * @param {String|Number} id - tile layer's id
 * @param {Object[]} [images=null] - images
 * @param {Object} [options=null] - options defined in [ImageLayer]{@link ImageLayer#options}
 * @example
 * new ImageLayer("images", [{
        url : 'http://example.com/foo.png',
        extent: [xmin, ymin, xmax, ymax],
        opacity : 1
    }])
 */
class ImageLayer extends Layer {

    constructor(id, images, options) {
        if (!Array.isArray(images) && !images.url) {
            options = images;
            images = null;
        }
        super(id, options);
        this._prepareImages(images);
    }

    /**
     * Set images and redraw
     * @param {Object[]} images - new images
     * @return {ImageLayer} this
     */
    setImages(images) {
        this._images = images;
        this._prepareImages(images);
        return this;
    }

    /**
     * Get images
     * @return {Object[]}
     */
    getImages() {
        return this._images;
    }

    _prepareImages(images) {
        images = images || [];
        if (!Array.isArray(images)) {
            images = [images];
        }
        this._imageData = images.map(img => {
            return extend({}, img, {
                extent : new Extent(img.extent),
            });
        });
        this._images = images;
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.refreshImages();
        }
    }
}

ImageLayer.mergeOptions(options);

const EMPTY_ARRAY = [];

export class ImageLayerCanvasRenderer extends CanvasRenderer {
    isDrawable() {
        if (this.getMap().getPitch()) {
            if (console) {
                console.warn('ImageLayer with canvas renderer can\'t be pitched, use gl renderer (\'renderer\' : \'gl\') instead.');
            }
            return false;
        }
        return true;
    }

    checkResources() {
        if (this._imageLoaded) {
            return EMPTY_ARRAY;
        }
        const layer = this.layer;
        let urls = layer._imageData.map(img => [img.url, null, null]);
        if (this.resources) {
            const unloaded = [];
            const resources = new ResourceCache();
            urls.forEach(url => {
                if (this.resources.isResourceLoaded(url)) {
                    const img = this.resources.getImage(url);
                    resources.addResource(url, img);
                } else {
                    unloaded.push(url);
                }
            });
            this.resources.forEach((url, res) => {
                if (!resources.isResourceLoaded(url)) {
                    this.retireImage(res.image);
                }
            });
            this.resources = resources;
            urls = unloaded;
        }
        this._imageLoaded = true;
        return urls;
    }

    retireImage(/* image */) {

    }

    refreshImages() {
        this._imageLoaded = false;
        this.setToRedraw();
    }

    needToRedraw() {
        const map = this.getMap();
        // don't redraw when map is zooming without pitch and layer doesn't have any point symbolizer.
        if (map.isZooming() && !map.getPitch()) {
            return false;
        }
        return super.needToRedraw();
    }

    draw() {
        if (!this.isDrawable()) {
            return;
        }
        this.prepareCanvas();
        this._painted = false;
        this._drawImages();
        this.completeRender();
    }

    _drawImages() {
        const imgData = this.layer._imageData;
        const map = this.getMap();
        const mapExtent = map.getExtent();
        if (imgData && imgData.length) {
            for (let i = 0; i < imgData.length; i++) {
                const extent = imgData[i].extent;
                const image = this.resources && this.resources.getImage(imgData[i].url);
                if (image && mapExtent.intersects(extent)) {
                    this._painted = true;
                    this._drawImage(image, extent, imgData[i].opacity || 1);
                }
            }
        }
    }

    _drawImage(image, extent, opacity) {
        let globalAlpha = 0;
        const ctx = this.context;
        if (opacity < 1) {
            globalAlpha = ctx.globalAlpha;
            ctx.globalAlpha = opacity;
        }
        const map = this.getMap();
        const min = map.coordToPoint(extent.getMin()),
            max = map.coordToPoint(extent.getMax());
        const point = map._pointToContainerPoint(min);
        let x = point.x, y = point.y;
        const bearing = map.getBearing();
        if (bearing) {
            ctx.save();
            ctx.translate(x, y);
            if (bearing) {
                ctx.rotate(-bearing * Math.PI / 180);
            }
            x = y = 0;
        }
        ctx.drawImage(image, x, y, max.x - min.x, max.y - min.y);
        if (bearing) {
            ctx.restore();
        }
        if (globalAlpha) {
            ctx.globalAlpha = globalAlpha;
        }
    }

    drawOnInteracting() {
        this.draw();
    }
}

export class ImageLayerGLRenderer extends ImageGLRenderable(ImageLayerCanvasRenderer) {

    //override to set to always drawable
    isDrawable() {
        return true;
    }

    _drawImage(image, extent, opacity) {
        const map = this.getMap();
        let extent2d = extent.__imagelayerposition;
        if (!extent2d) {
            extent2d = extent.__imagelayerposition = extent.convertTo(c => map.coordToPoint(c, map.getGLZoom()));
        }
        this.drawGLImage(image, extent2d.xmin, extent2d.ymin, extent2d.getWidth(), extent2d.getHeight(), opacity);
    }

    createContext() {
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

    retireImage(image) {
        this.disposeImage(image);
    }

    onRemove() {
        this.removeGLCanvas();
        super.onRemove();
    }
}

ImageLayer.registerRenderer('canvas', ImageLayerCanvasRenderer);
ImageLayer.registerRenderer('gl', ImageLayerGLRenderer);

export default ImageLayer;
