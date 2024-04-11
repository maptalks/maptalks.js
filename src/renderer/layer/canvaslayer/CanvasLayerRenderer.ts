import Canvas from '../../../core/Canvas';
import CanvasRenderer from '../../../renderer/layer/CanvasRenderer';

export default class CanvasLayerRenderer extends CanvasRenderer {
    public buffer: HTMLCanvasElement;
    _drawContext: any[];
    _predrawed: boolean;
    _shouldClear: boolean;

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
        if (map.isInteracting() && !this.layer.drawOnInteracting) {
            return false;
        }
        return super.needToRedraw();
    }

    draw(...args: any[]) {
        this.prepareCanvas();
        this.prepareDrawContext();
        this._drawLayer(...args);
    }

    drawOnInteracting(...args: any[]) {
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
            const prevent = this.layer.doubleBuffer(bufferContext, this.context);
            if (prevent === undefined || prevent) {
                Canvas.image(bufferContext, canvas, 0, 0);
                canvasImg.image = this.buffer;
            }
        }
        return canvasImg;
    }

    remove() {
        delete this._drawContext;
        return super.remove();
    }


    onZoomStart(param: any) {
        this.layer.onZoomStart(param);
        super.onZoomStart(param);
    }

    onZooming(param: any) {
        this.layer.onZooming(param);
        super.onZooming(param);
    }

    onZoomEnd(param: any) {
        this.layer.onZoomEnd(param);
        super.onZoomEnd(param);
    }

    onMoveStart(param: any) {
        this.layer.onMoveStart(param);
        super.onMoveStart(param);
    }

    onMoving(param: any) {
        this.layer.onMoving(param);
        super.onMoving(param);
    }

    onMoveEnd(param: any) {
        this.layer.onMoveEnd(param);
        super.onMoveEnd(param);
    }

    onResize(param: any) {
        this.layer.onResize(param);
        super.onResize(param);
    }

    prepareDrawContext() {
        if (!this._predrawed) {
            const params = ensureParams(this.getPrepareParams());
            this._drawContext = this.layer.prepareToDraw(this.context, ...params);
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
        const args: any[] = [this.context, view];
        const params = ensureParams(this.getDrawParams());
        return [
            ...args,
            ...params,
            ...this._drawContext
        ];
    }

    _drawLayer(...args: any[]) {
        const params = this._prepareDrawParams();
        if (!params) {
            return;
        }
        // eslint-disable-next-line prefer-spread
        this.layer.draw.apply(this.layer, params.concat(args));
        this.completeRender();
    }

    _drawLayerOnInteracting(...args: any[]) {
        if (!this.layer.drawOnInteracting) {
            return;
        }
        const params = this._prepareDrawParams();
        if (!params) {
            return;
        }
        this.layer.drawOnInteracting(...params, ...args);
        this.completeRender();
    }
}

function ensureParams(params?: any | any[]) {
    if (!params) {
        params = [];
    }
    if (!Array.isArray(params)) {
        params = [params];
    }
    return params;
}
