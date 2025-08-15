/* eslint-disable @typescript-eslint/ban-types */

import Canvas2D from '../../core/Canvas';
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

    resizeCanvas(canvasSize?: SizeLike): void {
        super.resizeCanvas(canvasSize);
        if (!this.context) {
            return;
        }
        const r = this.getMap().getDevicePixelRatio();
        this.context.dpr = 1;
        if (r !== 1) {
            this._canvasContextScale(this.context, r);
        }
    }

    createContext(): void {
        //Be compatible with layer renderers that overrides create canvas and create gl/context
        if (this.gl && this.gl.canvas === this.canvas || this.context) {
            return;
        }
        //disable willReadFrequently for render performance.Performance improved by 200 times
        this.context = Canvas2D.getCanvas2DPerformanceContext(this.canvas);
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
     * Clear the canvas to blank
     */
    clearCanvas(): void {
        if (!this.context) {
            return;
        }
        const map = this.getMap();
        if (!map) {
            return;
        }
        //fix #1597
        const r = this.mapDPR || map.getDevicePixelRatio();
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
