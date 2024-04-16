import { extend } from '../core/util';
import { getDepthFunc } from '../core/util/gl';
import Browser from '../core/Browser';
import Point from '../geo/Point';
import ImageGLRenderable from '../renderer/layer/ImageGLRenderable';
import CanvasRenderer from '../renderer/layer/CanvasRenderer';
import { ResourceCache } from '../renderer/layer/CanvasRenderer';
import Extent from '../geo/Extent';
import Layer, { LayerOptionsType } from './Layer';
import { PointExtent } from '../geo';


/**
 * 配置参数
 *
 * @english
 * @property options                     - ImageLayer's options
 * @property options.crossOrigin=null    - image's corssOrigin
 * @property options.renderer=gl         - ImageLayer's renderer, canvas or gl. gl tiles requires image CORS that canvas doesn't. canvas tiles can't pitch.
 * @property options.alphaTest=0         - only for gl renderer, pixels alpha <= alphaTest will be discarded
 * @property options.depthMask=true      - only for gl renderer, whether to write into depth buffer
 * @property options.depthFunc=String    - only for gl renderer, depth function, available values: never,<, =, <=, >, !=, >=, always
 * @memberOf ImageLayer
 * @instance
 */
const options: ImageLayerOptionsType = {
    renderer: Browser.webgl ? 'gl' : 'canvas',
    crossOrigin: null,
    alphaTest: false,
    depthMask: true,
    depthFunc: '<='
};

const TEMP_POINT = new Point(0, 0);

/**
 * images layer,可指定图像地理位置及透明的
 *
 * @english
 * @classdesc
 * A layer used to display images, you can specify each image's geographic extent and opacity
 * @category layer
 * @extends Layer
 * @param id - tile layer's id
 * @param images=null - images
 * @param options=null - options defined in [ImageLayer]{@link ImageLayer#options}
 * @example
 * new ImageLayer("images", [{
        url : 'http://example.com/foo.png',
        extent: [xmin, ymin, xmax, ymax],
        opacity : 1
    }])
 */
class ImageLayer extends Layer {
    _images: Array<ImageItem>;
    _imageData: Array<ImageDataItem>;

    constructor(id: string, images?: ImageLayerOptionsType | Array<ImageItem>, options?: ImageLayerOptionsType) {
        if (images && !Array.isArray(images) && !(images as ImageItem).url) {
            options = images;
            images = null;
        }
        super(id, options);
        this._images = images as Array<ImageItem>;
    }

    onAdd() {
        this._prepareImages(this._images);
    }

    /**
     * 设置图像并重新绘制
     *
     * @english
     * Set images and redraw
     * @param images - new images
     * @return this
     */
    setImages(images: Array<ImageItem>) {
        this._images = images;
        this._prepareImages(images);
        return this;
    }

    /**
     * 获取图像
     *
     * @english
     * Get images
     * @return
     */
    getImages(): Array<ImageItem> {
        return this._images;
    }

    _prepareImages(images: Array<ImageItem>) {
        images = images || [];
        if (!Array.isArray(images)) {
            images = [images];
        }
        const map = this.getMap();
        const glRes = map.getGLRes();
        this._imageData = images.map(img => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore 需/src/geo/Extent.js -> ts 并支持只传一个参数
            const extent = new Extent(img.extent);
            return extend({}, img, {
                extent: extent,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore 需/src/geo/Extent.js -> ts 并支持少传out参数
                extent2d: extent.convertTo(c => map.coordToPointAtRes(c, glRes))
            });
        });
        this._images = images;
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.refreshImages();
        }
    }

    getRenderer() {
        return super.getRenderer() as ImageLayerCanvasRenderer;
    }
}

ImageLayer.mergeOptions(options);

const EMPTY_ARRAY = [];

export class ImageLayerCanvasRenderer extends CanvasRenderer {
    _imageLoaded: boolean

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

    retireImage(image: ImageType) {
        const img = image as ImageBitmap;
        if (img.close) {
            img.close();
        }

    }

    refreshImages() {
        this._imageLoaded = false;
        this.setToRedraw();
    }

    draw(timestamp?: number, context?: any) {
        if (!this.isDrawable()) {
            return;
        }
        this.prepareCanvas();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this._painted = false;
        this._drawImages(timestamp, context);
        this.completeRender();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _drawImages(timestamp?: number, context?: any) {
        const imgData = this.layer._imageData;
        const map = this.getMap();
        const mapExtent = map.get2DExtentAtRes(map.getGLRes());
        if (imgData && imgData.length) {
            for (let i = 0; i < imgData.length; i++) {
                const extent = imgData[i].extent2d;
                const image = this.resources && this.resources.getImage(imgData[i].url);
                if (image && mapExtent.intersects(extent)) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    this._painted = true;
                    this._drawImage(image, extent, imgData[i].opacity || 1);
                }
            }
        }
    }

    _drawImage(image: ImageType, extent: PointExtent, opacity: number) {
        let globalAlpha = 0;
        const ctx = this.context;
        if (opacity < 1) {
            globalAlpha = ctx.globalAlpha;
            ctx.globalAlpha = opacity;
        }
        const map = this.getMap();
        const nw = TEMP_POINT.set(extent.xmin, extent.ymax);
        const point = map._pointAtResToContainerPoint(nw, map.getGLRes());
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
        const scale = map.getGLScale();
        ctx.drawImage(image, x, y, extent.getWidth() / scale, extent.getHeight() / scale);
        if (bearing) {
            ctx.restore();
        }
        if (globalAlpha) {
            ctx.globalAlpha = globalAlpha;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    drawOnInteracting(event?: any, timestamp?: number, context?: any) {
        this.draw();
    }
}

export class ImageLayerGLRenderer extends ImageGLRenderable(ImageLayerCanvasRenderer) {
    drawOnInteracting(event: any, timestamp: number, context: any) {
        this.draw(timestamp, context);
    }

    _prepareGLContext() {
        const gl = this.gl;
        if (gl) {
            gl.disable(gl.STENCIL_TEST);
            gl.disable(gl.POLYGON_OFFSET_FILL);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthFunc(getDepthFunc(this.layer.options['depthFunc']));
            const depthMask = !!this.layer.options['depthMask'];
            gl.depthMask(depthMask);
        }
    }

    _drawImages(timestamp?: number, parentContext?: any) {
        const gl = this.gl;
        if (parentContext && parentContext.renderTarget) {
            const fbo = parentContext.renderTarget.fbo;
            if (fbo) {
                const framebuffer = parentContext.renderTarget.getFramebuffer(fbo);
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            }
        }
        this._prepareGLContext();
        super._drawImages();
        if (parentContext && parentContext.renderTarget) {
            const fbo = parentContext.renderTarget.fbo;
            if (fbo) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
        }
    }

    //override to set to always drawable
    isDrawable() {
        return true;
    }

    _drawImage(image: ImageType, extent: PointExtent, opacity: number) {
        this.drawGLImage(image, extent.xmin, extent.ymax, extent.getWidth(), extent.getHeight(), 1, opacity);
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

    retireImage(image: ImageType) {
        const img = image as ImageBitmap;
        if (img.close) {
            img.close();
        }
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

export type ImageItem = {
    url: string,
    extent: Extent | [number, number, number, number],
    opacity?: number
}

export type ImageDataItem = ImageItem & {
    extent2d: PointExtent;
}

export type ImageType = HTMLImageElement | ImageBitmap;

enum depthFuncEnum {
    'never', '<', '=', '<=', ' >', '!=', '>=', 'always'
}
export type ImageLayerOptionsType = LayerOptionsType & {
    crossOrigin?: string,
    renderer?: 'canvas' | 'gl' | 'dom',
    alphaTest?: boolean,
    depthMask?: boolean,
    depthFunc?: keyof typeof depthFuncEnum
}
