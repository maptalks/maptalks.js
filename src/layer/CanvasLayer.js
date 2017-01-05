import { isNil, requestAnimFrame, cancelAnimFrame } from 'core/util';
import Browser from 'core/Browser';
import Canvas from 'core/Canvas';
import CanvasRenderer from 'renderer/layer/CanvasRenderer';
import Layer from './Layer';

const options = {
    'doubleBuffer'  : false,
    'animation'     : false,
    'fps'           : 70
};

/**
 * CanvasLayer provides some interface methods for canvas context operations. <br>
 * You can use it directly, but can't ser/dser a CanvasLayer with json in this way. <br>
 * It is more recommended to extend it with a subclass and implement canvas paintings inside the subclass.
 * @classdesc
 * A layer with a HTML5 2D canvas context.
 * @example
 *  var layer = new CanvasLayer('canvas');
 *
 *  layer.prepareToDraw = function (context) {
 *      var size = map.getSize();
 *      return [size.width, size.height]
 *  };
 *
 *  layer.draw = function (context, width, height) {
 *      context.fillStyle = "#f00";
 *      context.fillRect(0, 0, w, h);
 *  };
 *  layer.addTo(map);
 * @class
 * @category layer
 * @extends {Layer}
 * @param {String|Number} id - layer's id
 * @param {Object} options - options defined in [options]{@link CanvasLayer#options}
 */
export default class CanvasLayer extends Layer {

    /**
     * An optional interface function called only once before the first draw, useful for preparing your canvas operations.
     * @param  {CanvasRenderingContext2D } context - CanvasRenderingContext2D of the layer canvas.
     * @return {Object[]} objects that will be passed to function draw(context, ..) as parameters.
     */
    prepareToDraw() {}

    /**
     * The required interface function to draw things on the layer canvas.
     * @param  {CanvasRenderingContext2D} context - CanvasRenderingContext2D of the layer canvas.
     * @param  {*} params.. - parameters returned by function prepareToDraw(context).
     */
    draw() {}

    play() {
        if (this._getRenderer()) {
            this._getRenderer().startAnim();
        }
        return this;
    }

    pause() {
        if (this._getRenderer()) {
            this._getRenderer().pauseAnim();
        }
        return this;
    }

    isPlaying() {
        if (this._getRenderer()) {
            return this._getRenderer().isPlaying();
        }
        return false;
    }

    clearCanvas() {
        if (this._getRenderer()) {
            this._getRenderer().clearCanvas();
        }
        return this;
    }

    /**
     * Ask the map to redraw the layer canvas without firing any event.
     * @return {CanvasLayer} this
     */
    requestMapToRender() {
        if (this._getRenderer()) {
            this._getRenderer().requestMapToRender();
        }
        return this;
    }

    /**
     * Ask the map to redraw the layer canvas and fire layerload event
     * @return {CanvasLayer} this
     */
    completeRender() {
        if (this._getRenderer()) {
            this._getRenderer().completeRender();
        }
        return this;
    }

    onCanvasCreate() {
        return this;
    }

    /**
     * The event callback for map's zoomstart event.
     * @param  {Object} param - event parameter
     */
    onZoomStart() {}

    /**
     * The event callback for map's zoomend event.
     * @param  {Object} param - event parameter
     */
    onZoomEnd() {}

    /**
     * The event callback for map's movestart event.
     * @param  {Object} param - event parameter
     */
    onMoveStart() {}

    /**
     * The event callback for map's moveend event.
     * @param  {Object} param - event parameter
     */
    onMoveEnd() {}

    /**
     * The event callback for map's resize event.
     * @param  {Object} param - event parameter
     */
    onResize() {}

    doubleBuffer(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return this;
    }
}

CanvasLayer.mergeOptions(options);

CanvasLayer.registerRenderer('canvas', class extends CanvasRenderer {

    onCanvasCreate() {
        if (this.canvas && this.layer.options['doubleBuffer']) {
            var map = this.getMap();
            this.buffer = Canvas.createCanvas(this.canvas.width, this.canvas.height, map.CanvasClass);
        }
    }

    draw() {
        if (!this._predrawed) {
            this._drawContext = this.layer.prepareToDraw(this.context);
            if (!this._drawContext) {
                this._drawContext = [];
            }
            if (!Array.isArray(this._drawContext)) {
                this._drawContext = [this._drawContext];
            }
            this._predrawed = true;
        }
        this.prepareCanvas();
        this._drawLayer();
    }

    getCanvasImage() {
        var canvasImg = CanvasRenderer.prototype.getCanvasImage.apply(this, arguments);
        if (canvasImg && canvasImg.image && this.layer.options['doubleBuffer']) {
            var canvas = canvasImg.image;
            if (this.buffer.width !== canvas.width || this.buffer.height !== canvas.height) {
                this.buffer.width = canvas.width;
                this.buffer.height = canvas.height;
            }
            var bufferContext = this.buffer.getContext('2d');
            this.layer.doubleBuffer(bufferContext, this.context);
            bufferContext.drawImage(canvas, 0, 0);
            canvasImg.image = this.buffer;
        }
        return canvasImg;
    }

    startAnim() {
        this._animTime = Date.now();
        this._paused = false;
        this._play();
    }

    pauseAnim() {
        this._pause();
        this._paused = true;
        delete this._animTime;
    }

    isPlaying() {
        return !isNil(this._animFrame);
    }

    hide() {
        this._pause();
        return CanvasRenderer.prototype.hide.call(this);
    }

    show() {
        return CanvasRenderer.prototype.show.call(this);
    }

    remove() {
        this._pause();
        delete this._drawContext;
        return CanvasRenderer.prototype.remove.call(this);
    }

    onZoomStart(param) {
        this._pause();
        this.layer.onZoomStart(param);
        CanvasRenderer.prototype.onZoomStart.call(this);
    }

    onZoomEnd(param) {
        this.layer.onZoomEnd(param);
        CanvasRenderer.prototype.onZoomEnd.call(this);
    }

    onMoveStart(param) {
        this._pause();
        this.layer.onMoveStart(param);
        CanvasRenderer.prototype.onMoveStart.call(this);
    }

    onMoveEnd(param) {
        this.layer.onMoveEnd(param);
        CanvasRenderer.prototype.onMoveEnd.call(this);
    }

    onResize(param) {
        this.layer.onResize(param);
        CanvasRenderer.prototype.onResize.call(this);
    }

    _drawLayer() {
        var args = [this.context];
        if (this._animTime) {
            args.push(Date.now() - this._animTime);
        }
        args.push.apply(args, this._drawContext);
        this.layer.draw.apply(this.layer, args);
        this.completeRender();
        this._play();
    }

    _pause() {
        if (this._animFrame) {
            cancelAnimFrame(this._animFrame);
            delete this._animFrame;
        }
        if (this._fpsFrame) {
            clearTimeout(this._fpsFrame);
            delete this._fpsFrame;
        }
    }

    _play() {
        if (this._paused || !this.layer || !this.layer.options['animation']) {
            return;
        }
        if (!this._animTime) {
            this._animTime = Date.now();
        }
        var frameFn = this._drawLayer.bind(this);
        this._pause();
        var fps = this.layer.options['fps'];
        if (fps >= 1000 / 16) {
            this._animFrame = requestAnimFrame(frameFn);
        } else {
            this._fpsFrame = setTimeout(function () {
                if (Browser.ie9) {
                    // ie9 doesn't support RAF
                    frameFn();
                    this._animFrame = 1;
                } else {
                    this._animFrame = requestAnimFrame(frameFn);
                }
            }.bind(this), 1000 / this.layer.options['fps']);
        }
    }
});

CanvasLayer.registerAs('CanvasLayer');
