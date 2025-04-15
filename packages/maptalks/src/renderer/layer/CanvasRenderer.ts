/* eslint-disable @typescript-eslint/ban-types */

import { calCanvasSize } from '../../core/util';
import Canvas2D from '../../core/Canvas';
import Point from '../../geo/Point';
import { SizeLike } from '../../geo/Size';
import { TileRenderingContext } from '../types';
import LayerAbstractRenderer from './LayerAbstractRenderer';


/**
 * 在 HTMLCanvasElement 上渲染图层的基类
 * @english
 * Base Class to render layer on HTMLCanvasElement
 * @abstract
 * @protected
 * @memberOf renderer
 * @extends Class
 */
class CanvasRenderer extends LayerAbstractRenderer {

    gl: TileRenderingContext;

    //@internal
    _canvasUpdated: boolean;

    drawOnInteracting?(...args: any[]): void;
    checkResources?(): any[];
    getImageData?(): ImageData;
    draw?(...args: any[]): void;


    /**
     * Ask whether the layer renderer needs to redraw
     */
    needToRedraw(): boolean {
        const map = this.getMap();
        if (map.isInteracting() || map.getRenderer().isViewChanged()) {
            // don't redraw when map is moving without any pitch
            return !(!map.getPitch() && map.isMoving() && !map.isZooming() && !map.isRotating() && !this.layer.options['forceRenderOnMoving']);
        }
        return false;
    }


    /**
     *  Mark layer's canvas updated
     */
    setCanvasUpdated() {
        this._canvasUpdated = true;
        return this;
    }

    /**
     * Only called by map's renderer to check whether the layer's canvas is updated
     * @protected
     * @return {Boolean}
     */
    isCanvasUpdated(): boolean {
        return !!this._canvasUpdated;
    }

    /**
     * Get renderer's Canvas image object
     */
    getCanvasImage(): any {
        const map = this.getMap();
        this._canvasUpdated = false;
        if (this._renderZoom !== map.getZoom() || !this.canvas || !this._extent2D) {
            return null;
        }
        if (this.isBlank()) {
            return null;
        }
        if (this.layer.isEmpty && this.layer.isEmpty()) {
            return null;
        }
        // size = this._extent2D.getSize(),
        const containerPoint = map._pointToContainerPoint(this.middleWest)._add(0, -map.height / 2);
        return {
            'image': this.canvas,
            'layer': this.layer,
            'point': containerPoint/* ,
            'size': size */
        };
    }

    /**
     * Clear canvas
     */
    clear(): void {
        this.clearCanvas();
    }


    /**
     * Create renderer's Canvas
     */
    createCanvas(): void {
        if (this.canvas) {
            return;
        }
        const map = this.getMap();
        const size = map.getSize();
        const r = map.getDevicePixelRatio(),
            w = Math.round(r * size.width),
            h = Math.round(r * size.height);
        if (this.layer._canvas) {
            const canvas = this.layer._canvas;
            canvas.width = w;
            canvas.height = h;
            if (canvas.style) {
                canvas.style.width = size.width + 'px';
                canvas.style.height = size.height + 'px';
            }
            this.canvas = this.layer._canvas;
        } else {
            this.canvas = Canvas2D.createCanvas(w, h, map.CanvasClass);
        }

        this.onCanvasCreate();

    }

    onCanvasCreate(): void {

    }

    //@internal
    _canvasContextScale(context: CanvasRenderingContext2D, dpr: number) {
        context.scale(dpr, dpr);
        context.dpr = dpr;
        return this;
    }

    createContext(): void {
        //Be compatible with layer renderers that overrides create canvas and create gl/context
        if (this.gl && this.gl.canvas === this.canvas || this.context) {
            return;
        }
        this.context = Canvas2D.getCanvas2DContext(this.canvas);
        if (!this.context) {
            return;
        }
        this.context.dpr = 1;
        if (this.layer.options['globalCompositeOperation']) {
            this.context.globalCompositeOperation = this.layer.options['globalCompositeOperation'];
        }
        const dpr = this.getMap().getDevicePixelRatio();
        if (dpr !== 1) {
            this._canvasContextScale(this.context, dpr);
        }
    }

    resetCanvasTransform(): void {
        if (!this.context) {
            return;
        }
        const dpr = this.getMap().getDevicePixelRatio();
        this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /**
     * Resize the canvas
     * @param canvasSize the size resizing to
     */
    resizeCanvas(canvasSize?: SizeLike): void {
        const canvas = this.canvas;
        if (!canvas) {
            return;
        }
        const size = canvasSize || this.getMap().getSize();
        const r = this.getMap().getDevicePixelRatio();
        const { width, height, cssWidth, cssHeight } = calCanvasSize(size, r);
        // width/height不变并不意味着 css width/height 不变
        if (this.layer._canvas && (canvas.style.width !== cssWidth || canvas.style.height !== cssHeight)) {
            canvas.style.width = cssWidth;
            canvas.style.height = cssHeight;
        }

        if (canvas.width === width && canvas.height === height) {
            return;
        }
        //retina support
        canvas.height = height;
        canvas.width = width;
        if (this.context) {
            this.context.dpr = 1;
        }
        if (r !== 1 && this.context) {
            this._canvasContextScale(this.context, r);
        }
    }

    /**
     * Clear the canvas to blank
     */
    clearCanvas(): void {
        if (!this.context || !this.getMap()) {
            return;
        }
        //fix #1597
        const r = this.mapDPR || this.getMap().getDevicePixelRatio();
        const rScale = 1 / r;
        const w = this.canvas.width * rScale, h = this.canvas.height * rScale;
        Canvas2D.clearRect(this.context, 0, 0, Math.max(w, this.canvas.width), Math.max(h, this.canvas.height));
    }

    /**
     * @english
     * Prepare the canvas for rendering. <br>
     * 1. Clear the canvas to blank. <br>
     * 2. Clip the canvas by mask if there is any and return the mask's extent
     * @return {PointExtent} mask's extent of current zoom's 2d point.
     */
    prepareCanvas(): any {
        if (!this.canvas) {
            this.createCanvas();
            this.createContext();
            this.layer.onCanvasCreate();
            /**
             * canvascreate event, fired when canvas created.
             *
             * @event Layer#canvascreate
             * @type {Object}
             * @property {String} type     - canvascreate
             * @property {Layer} target    - layer
             * @property {CanvasRenderingContext2D} context - canvas's context
             * @property {WebGLRenderingContext2D} gl  - canvas's webgl context
             */
            this.layer.fire('canvascreate', {
                'context': this.context,
                'gl': this.gl
            });
        } else {
            this.resetCanvasTransform();
            this.clearCanvas();
            this.resizeCanvas();
        }
        delete this._maskExtent;
        const mask = this.layer.getMask();
        // this.context may be not available
        if (!mask) {
            this.layer.fire('renderstart', {
                'context': this.context,
                'gl': this.gl
            });
            return null;
        }
        const maskExtent2D = this._maskExtent = mask._getMaskPainter().get2DExtent();
        //fix vt _extent2D is null
        if (maskExtent2D && this._extent2D && !maskExtent2D.intersects(this._extent2D)) {
            this.layer.fire('renderstart', {
                'context': this.context,
                'gl': this.gl
            });
            return maskExtent2D;
        }
        /**
         * renderstart event, fired when layer starts to render.
         *
         * @event Layer#renderstart
         * @type {Object}
         * @property {String} type              - renderstart
         * @property {Layer} target    - layer
         * @property {CanvasRenderingContext2D} context - canvas's context
         */
        this.layer.fire('renderstart', {
            'context': this.context,
            'gl': this.gl
        });
        return maskExtent2D;
    }

    clipCanvas(context: CanvasRenderingContext2D) {
        const mask = this.layer.getMask();
        if (!mask) {
            return false;
        }
        if (!this.layer.options.maskClip) {
            return false;
        }
        const old = this.middleWest;
        const map = this.getMap();
        //when clipping, layer's middleWest needs to be reset for mask's containerPoint conversion
        this.middleWest = map._containerPointToPoint(new Point(0, map.height / 2));
        //geometry 渲染逻辑里会修改globalAlpha，这里保存一下
        const alpha = context.globalAlpha;
        context.save();
        const dpr = this.mapDPR || map.getDevicePixelRatio();
        if (dpr !== 1) {
            context.save();
            this._canvasContextScale(context, dpr);
        }
        // Handle MultiPolygon
        if (mask.getGeometries) {
            context.isMultiClip = true;
            const masks = mask.getGeometries() || [];
            context.beginPath();
            masks.forEach(_mask => {
                const painter = _mask._getMaskPainter();
                painter.paint(null, context);
            });
            context.stroke();
            context.isMultiClip = false;
        } else {
            context.isClip = true;
            context.beginPath();
            const painter = mask._getMaskPainter();
            painter.paint(null, context);
            context.isClip = false;
        }
        if (dpr !== 1) {
            context.restore();
        }
        try {
            context.clip('evenodd');
        } catch (error) {
            console.error(error);
        }
        this.middleWest = old;
        context.globalAlpha = alpha;
        return true;
    }


    /**
     * call when rendering completes, this will fire necessary events and call setCanvasUpdated
     */
    completeRender(): void {
        if (this.getMap()) {
            this._renderComplete = true;
            /**
             * renderend event, fired when layer ends rendering.
             *
             * @event Layer#renderend
             * @type {Object}
             * @property {String} type              - renderend
             * @property {Layer} target    - layer
             * @property {CanvasRenderingContext2D} context - canvas's context
             */
            this.layer.fire('renderend', {
                'context': this.context,
                'gl': this.gl
            });
            this.setCanvasUpdated();
        }
    }


    /**
    * onResize
    * @param  {Object} param event parameters
    */
    onResize(_param: any) {
        delete this._extent2D;
        this.resizeCanvas();
        this.setToRedraw();
    }

}

export default CanvasRenderer;



