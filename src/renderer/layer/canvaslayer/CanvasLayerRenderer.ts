import Canvas from '../../../core/Canvas';
import CanvasRenderer from '../CanvasRenderer';

export default class CanvasLayerRenderer extends CanvasRenderer {
    buffer: any;
    _predrawed: boolean;
    _drawContext: any;

    getPrepareParams() {
        return [];
    }

    getDrawParams() {
        return [];
    }

    onCanvasCreate() {
        if (this.canvas && this.layer.options['doubleBuffer']) {
            this.buffer = Canvas.createCanvas(this.canvas.width, this.canvas.height, this.getMap().CanvasClass);
        }
    }

    needToRedraw() {
        if (this.layer.options['animation']) {
            return true;
        }
        const map = this.getMap();
        //@ts-ignore
        if (map.isInteracting() && !this.layer.drawOnInteracting) {
            return false;
        }
        return super.needToRedraw();
    }

    draw(...args) {
        this.prepareCanvas();
        this.prepareDrawContext();
        this._drawLayer(...args);
    }
    //@ts-ignore
    drawOnInteracting(...args) {
        this._drawLayerOnInteracting(...args);
    }

    getCanvasImage() {
        const canvasImg = super.getCanvasImage();
        if (canvasImg && canvasImg.image && this.layer.options['doubleBuffer']) {
            const canvas = canvasImg.image;
            if (this.buffer.width !== canvas.width || this.buffer.height !== canvas.height) {
                this.buffer.width = canvas.width;
                this.buffer.height = canvas.height;
            }
            const bufferContext = this.buffer.getContext('2d');
            //@ts-ignore
            const prevent = this.layer.doubleBuffer(bufferContext, this.context);
            if (prevent === undefined || prevent) {
                Canvas.image(bufferContext, canvas, 0, 0);
                canvasImg.image = this.buffer;
            }
        }
        return canvasImg;
    }

    remove() {
        //@ts-ignore
        delete this._drawContext;
        return super.remove();
    }

    //@ts-ignore
    onZoomStart(param) {
        //@ts-ignore
        this.layer.onZoomStart(param);
        //@ts-ignore
        super.onZoomStart(param);
    }
    //@ts-ignore
    onZooming(param) {
        //@ts-ignore
        this.layer.onZooming(param);
        //@ts-ignore
        super.onZooming(param);
    }
    //@ts-ignore
    onZoomEnd(param) {
        //@ts-ignore
        this.layer.onZoomEnd(param);
        //@ts-ignore
        super.onZoomEnd(param);
    }
    //@ts-ignore
    onMoveStart(param) {
        //@ts-ignore
        this.layer.onMoveStart(param);
        //@ts-ignore
        super.onMoveStart(param);
    }
    //@ts-ignore
    onMoving(param) {
        //@ts-ignore
        this.layer.onMoving(param);
        //@ts-ignore
        super.onMoving(param);
    }
    //@ts-ignore
    onMoveEnd(param) {
        //@ts-ignore
        this.layer.onMoveEnd(param);
        //@ts-ignore
        super.onMoveEnd(param);
    }
    //@ts-ignore
    onResize(param) {
        //@ts-ignore
        this.layer.onResize(param);
        //@ts-ignore
        super.onResize(param);
    }

    prepareDrawContext() {
        if (!this._predrawed) {
            const params = ensureParams(this.getPrepareParams());
            //@ts-ignore
            this._drawContext = this.layer.prepareToDraw.apply(this.layer, [this.context].concat(params));
            if (!this._drawContext) {
                this._drawContext = [];
            }
            if (!Array.isArray(this._drawContext)) {
                this._drawContext = [this._drawContext];
            }
            this._predrawed = true;
        }
    }

    _prepareDrawParams() {
        if (!this.getMap()) {
            return null;
        }
        const view = this.getViewExtent();
        if (view['maskExtent'] && !view['extent'].intersects(view['maskExtent'])) {
            this.completeRender();
            return null;
        }
        const args = [this.context, view];
        const params = ensureParams(this.getDrawParams());
        args.push.apply(args, params);
        args.push.apply(args, this._drawContext);
        return args;
    }

    _drawLayer(...args) {
        const params = this._prepareDrawParams();
        if (!params) {
            return;
        }
        //@ts-ignore
        this.layer.draw.apply(this.layer, params.concat(args));
        this.completeRender();
    }

    _drawLayerOnInteracting(...args) {
        //@ts-ignore
        if (!this.layer.drawOnInteracting) {
            return;
        }
        const params = this._prepareDrawParams();
        if (!params) {
            return;
        }
        //@ts-ignore
        this.layer.drawOnInteracting.apply(this.layer, params.concat(args));
        this.completeRender();
    }
}

function ensureParams(params) {
    if (!params) {
        params = [];
    }
    if (!Array.isArray(params)) {
        params = [params];
    }
    return params;
}
