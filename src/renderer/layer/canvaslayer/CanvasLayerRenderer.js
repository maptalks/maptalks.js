import { isNil, requestAnimFrame, cancelAnimFrame } from 'core/util';
import Browser from 'core/Browser';
import Canvas from 'core/Canvas';
import CanvasRenderer from 'renderer/layer/CanvasRenderer';

export default class CanvasLayerRenderer extends CanvasRenderer {

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

    draw() {
        this.prepareCanvas();
        if (!this._predrawed) {
            const params = ensureParams(this.getPrepareParams());
            this._drawContext = this.layer.prepareToDraw.apply(this.layer, [this.context].concat(params));
            if (!this._drawContext) {
                this._drawContext = [];
            }
            if (!Array.isArray(this._drawContext)) {
                this._drawContext = [this._drawContext];
            }
            this._predrawed = true;
        }
        this._drawLayer();
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

    startAnim() {
        this._paused = false;
        this.play();
    }

    pauseAnim() {
        this.pause();
        this._paused = true;
    }

    isPlaying() {
        return !isNil(this._animFrame);
    }

    hide() {
        this.pause();
        return super.hide();
    }

    show() {
        return super.show();
    }

    remove() {
        this.pause();
        delete this._drawContext;
        return super.remove();
    }

    isRenderOnZooming() {
        if (this.layer.options['renderOnZooming']) {
            return true;
        }
        return super.isRenderOnZooming();
    }

    isRenderOnMoving() {
        if (this.layer.options['renderOnMoving']) {
            return true;
        }
        return super.isRenderOnMoving();
    }

    onZoomStart(param) {
        this.pause();
        this.layer.onZoomStart(param);
        super.onZoomStart(param);
    }

    onZoomEnd(param) {
        this.layer.onZoomEnd(param);
        super.onZoomEnd(param);
    }

    onMoveStart(param) {
        this.pause();
        this.layer.onMoveStart(param);
        super.onMoveStart(param);
    }

    onMoveEnd(param) {
        this.layer.onMoveEnd(param);
        super.onMoveEnd(param);
    }

    onResize(param) {
        this.layer.onResize(param);
        super.onResize(param);
    }

    _drawLayer() {
        if (!this.getMap()) {
            return;
        }
        const view = this.getViewExtent();
        if (view['maskExtent'] && !view['extent'].intersects(view['maskExtent'])) {
            this.completeRender();
            return;
        }
        const args = [this.context, view];
        const params = ensureParams(this.getDrawParams());
        args.push.apply(args, params);
        args.push.apply(args, this._drawContext);
        this.layer.draw.apply(this.layer, args);
        this.completeRender();
        this.play();
    }

    pause() {
        if (this._animFrame) {
            cancelAnimFrame(this._animFrame);
            delete this._animFrame;
        }
        if (this._fpsFrame) {
            clearTimeout(this._fpsFrame);
            delete this._fpsFrame;
        }
    }

    play() {
        if (this._paused || !this.layer || !this.layer.options['animation']) {
            return;
        }
        if (!this._bindDrawLayer) {
            this._bindDrawLayer = this._drawLayer.bind(this);
        }
        this.pause();
        const fps = this.layer.options['fps'];
        if (fps >= 1000 / 16) {
            this._animFrame = requestAnimFrame(this._bindDrawLayer);
        } else {
            this._fpsFrame = setTimeout(() => {
                if (Browser.ie9) {
                    // ie9 doesn't support RAF
                    this._bindDrawLayer();
                    this._animFrame = 1;
                } else {
                    this._animFrame = requestAnimFrame(this._bindDrawLayer);
                }
            }, 1000 / fps);
        }
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
