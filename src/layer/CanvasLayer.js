import CanvasLayerRenderer from 'renderer/layer/canvaslayer/CanvasLayerRenderer';
import Layer from './Layer';

/**
 * @property {Object} options                  - configuration options
 * @property {Boolean} [options.doubleBuffer=false]    - layer is rendered with doubleBuffer
 * @property {Boolean} [options.animation=false]       - if the layer is an animated layer
 * @property {Boolean} [fps=1000 / 16]                 - animation fps
 * @memberOf CanvasLayer
 * @instance
 */
const options = {
    'doubleBuffer'  : false,
    'animation'     : false,
    'fps'           : 1000 / 16
};

/**
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

CanvasLayer.registerRenderer('canvas', CanvasLayerRenderer);

export default CanvasLayer;
