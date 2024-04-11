import CanvasLayerRenderer from '../renderer/layer/canvaslayer/CanvasLayerRenderer';
import Layer, { LayerOptionsType } from './Layer';

/**
 * @property options                       - configuration options
 * @property options.doubleBuffer=false    - layer is rendered with doubleBuffer
 * @property options.animation=false       - if the layer is an animated layer
 * @property fps=1000 / 16                 - animation fps
 * @memberOf CanvasLayer
 * @instance
 */

const options: CanvasLayerOptionsType = {
    'doubleBuffer': false,
    'animation': false
};

/**
 * 一个带有HTML5 2D canvas的layer
 * CanvasLayer为canvas操作提供了一些接口方法
 * 你可以直接使用CanvasLayer,但不能通过JSON序列化/反序列化实现CanvasLayer
 * 更推荐使用子类扩展CanvasLayer，并在子类中实现canvas绘画
 *
 * @english
 * A layer with a HTML5 2D canvas context.<br>
 * CanvasLayer provides some interface methods for canvas context operations. <br>
 * You can use it directly, but can't serialize/deserialize a CanvasLayer with JSON in this way. <br>
 * It is more recommended to extend it with a subclass and implement canvas paintings inside the subclass.
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
 * @category layer
 * @extends Layer
 * @param {String|Number} id - layer's id
 * @param {Object} options - options defined in [options]{@link CanvasLayer#options}
 */
class CanvasLayer extends Layer {

    isCanvasRender() {
        return true;
    }

    /**
     * 准备画布的接口函数
     *
     * @engilsh
     * An optional interface function called only once before the first draw, useful for preparing your canvas operations.
     * @param  {CanvasRenderingContext2D } context - CanvasRenderingContext2D of the layer canvas.
     * @return {Object[]} objects that will be passed to function draw(context, ..) as parameters.
     */
    prepareToDraw() { }

    /**
     * 绘制something的接口函数
     *
     * @engilsh
     * The required interface function to draw things on the layer canvas.
     * @param  {CanvasRenderingContext2D} context - CanvasRenderingContext2D of the layer canvas.
     * @param  {*} params.. - parameters returned by function prepareToDraw(context).
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    draw(...params) { }

    /**
     * map交互绘制接口
     * 默认情况调用draw()
     * 如果你知道如何提升绘制性能可以重新此方法
     *
     * @english
     * An optional interface function to draw while map is interacting.
     * By default, it will call draw method instead.
     * You can override this method if you are clear with what to draw when interacting to improve performance.
     * @param  {CanvasRenderingContext2D} context - CanvasRenderingContext2D of the layer canvas.
     * @param  {*} params.. - parameters returned by function prepareToDraw(context).
     */
    // drawOnInteracting() {
    //     return this.draw.apply(this, arguments);
    // }

    /**
     * 重绘
     *
     * @english
     * Redraw the layer
     * @return this
     */
    redraw() {
        if (this._getRenderer()) {
            this._getRenderer().setToRedraw();
        }
        return this;
    }

    /**
     * 播放
     *
     * @english
     * Start animation
     * @return this
     */
    play() {
        this.config('animation', true);
        return this;
    }

    /**
     * 暂停
     *
     * @english
     * Pause the animation
     * @return this
     */
    pause() {
        this.config('animation', false);
        return this;
    }

    /**
     * 是否正在播放
     *
     * @english
     * If the animation is playing
     * @return
     */
    isPlaying(): boolean {
        return this.options['animation'];
    }

    /**
     * 清空画布
     *
     * @engilsh
     * Clear layer's canvas
     * @return this
     */
    clearCanvas() {
        if (this._getRenderer()) {
            this._getRenderer().clearCanvas();
        }
        return this;
    }

    /**
     * 要求map不触发任何事件下重绘canvas
     *
     * @engilsh
     * Ask the map to redraw the layer canvas without firing any event.
     * @return this
     */
    requestMapToRender() {
        const renderer = this._getRenderer() as any;
        if (renderer && renderer.requestMapToRender) {
            renderer.requestMapToRender();
        }
        return this;
    }

    /**
     * 要求map触发layerload事件重绘canvas
     *
     * @engilsh
     * Ask the map to redraw the layer canvas and fire layerload event
     * @return this
     */
    completeRender() {
        if (this._getRenderer()) {
            this._getRenderer().completeRender();
        }
        return this;
    }

    /**
     * canvas创建完成后的回调函数
     *
     * @english
     * Callback function when layer's canvas is created. <br>
     * Override it to do anything needed.
     */
    onCanvasCreate() {
        return this;
    }

    /**
     * map zoomstart事件回调
     *
     * @engilsh
     * The event callback for map's zoomstart event.
     * @param  {Object} param - event parameter
     */
    onZoomStart() { }

    /**
     * map zooming事件回调
     *
     * @engilsh
     * The event callback for map's zooming event.
     * @param  {Object} param - event parameter
     */
    onZooming() { }

    /**
     * map zoomend事件回调
     *
     * @engilsh
     * The event callback for map's zoomend event.
     * @param  {Object} param - event parameter
     */
    onZoomEnd() { }

    /**
     * map movestart事件回调
     *
     * @engilsh
     * The event callback for map's movestart event.
     * @param  {Object} param - event parameter
     */
    onMoveStart() { }

    /**
     * map moving事件回调
     *
     * @engilsh
     * The event callback for map's moving event.
     * @param  {Object} param - event parameter
     */
    onMoving() { }

    /**
     * map moveend事件回调
     *
     * @engilsh
     * The event callback for map's moveend event.
     * @param  {Object} param - event parameter
     */
    onMoveEnd() { }

    /**
     * map resize事件回调
     *
     * @engilsh
     * The event callback for map's resize event.
     * @param  {Object} param - event parameter
     */
    onResize() { }

    /**
     * double buffer的回调函数
     * 默认情况下just draws and return，如果你需要在绘制之前处理canvas，可以重写改函数
     *
     * @engilsh
     * The callback function to double buffer. <br>
     * In default, it just draws and return, and you can override it if you need to process the canvas image before drawn.
     * @param  {CanvasRenderingContext2D} bufferContext CanvasRenderingContext2D of double buffer of the layer canvas.
     * @param  {CanvasRenderingContext2D} context CanvasRenderingContext2D of the layer canvas.
     */
    doubleBuffer(bufferContext: CanvasRenderingContext2D/*, context?:CanvasRenderingContext2D*/): CanvasLayer {
        bufferContext.clearRect(0, 0, bufferContext.canvas.width, bufferContext.canvas.height);
        return this;
    }

    _getRenderer() {
        return super._getRenderer() as CanvasLayerRenderer;
    }
}

CanvasLayer.mergeOptions(options);
CanvasLayer.registerRenderer('canvas', CanvasLayerRenderer);

export default CanvasLayer;

export type CanvasLayerOptionsType = LayerOptionsType & {
    doubleBuffer?: boolean,
    animation?: boolean,
    fps?: number | string
}
