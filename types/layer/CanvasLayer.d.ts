import Layer, { LayerOptionsType } from './Layer';
export type CanvasLayerOptionsType = LayerOptionsType & {
    'doubleBuffer'?: boolean;
    'animation'?: boolean;
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
declare class CanvasLayer extends Layer {
    isCanvasRender(): boolean;
    /**
     * An optional interface function called only once before the first draw, useful for preparing your canvas operations.
     * @param  {CanvasRenderingContext2D } context - CanvasRenderingContext2D of the layer canvas.
     * @return {Object[]} objects that will be passed to function draw(context, ..) as parameters.
     */
    prepareToDraw(): void;
    /**
     * The required interface function to draw things on the layer canvas.
     * @param  {CanvasRenderingContext2D} context - CanvasRenderingContext2D of the layer canvas.
     * @param  {*} params.. - parameters returned by function prepareToDraw(context).
     */
    draw(): void;
    /**
     * An optional interface function to draw while map is interacting.
     * By default, it will call draw method instead.
     * You can override this method if you are clear with what to draw when interacting to improve performance.
     * @param  {CanvasRenderingContext2D} context - CanvasRenderingContext2D of the layer canvas.
     * @param  {*} params.. - parameters returned by function prepareToDraw(context).
     */
    /**
     * Redraw the layer
     * @return {CanvasLayer} this
     */
    redraw(): this;
    /**
     * Start animation
     * @return {CanvasLayer} this
     */
    play(): this;
    /**
     * Pause the animation
     * @return {CanvasLayer} this
     */
    pause(): this;
    /**
     * If the animation is playing
     * @return {Boolean}
     */
    isPlaying(): any;
    /**
     * Clear layer's canvas
     * @return {CanvasLayer} this
     */
    clearCanvas(): this;
    /**
     * Ask the map to redraw the layer canvas without firing any event.
     * @return {CanvasLayer} this
     */
    requestMapToRender(): this;
    /**
     * Ask the map to redraw the layer canvas and fire layerload event
     * @return {CanvasLayer} this
     */
    completeRender(): this;
    /**
     * Callback function when layer's canvas is created. <br>
     * Override it to do anything needed.
     */
    onCanvasCreate(): this;
    /**
     * The event callback for map's zoomstart event.
     * @param  {Object} param - event parameter
     */
    onZoomStart(): void;
    /**
     * The event callback for map's zooming event.
     * @param  {Object} param - event parameter
     */
    onZooming(): void;
    /**
     * The event callback for map's zoomend event.
     * @param  {Object} param - event parameter
     */
    onZoomEnd(): void;
    /**
     * The event callback for map's movestart event.
     * @param  {Object} param - event parameter
     */
    onMoveStart(): void;
    /**
     * The event callback for map's moving event.
     * @param  {Object} param - event parameter
     */
    onMoving(): void;
    /**
     * The event callback for map's moveend event.
     * @param  {Object} param - event parameter
     */
    onMoveEnd(): void;
    /**
     * The event callback for map's resize event.
     * @param  {Object} param - event parameter
     */
    onResize(): void;
    /**
     * The callback function to double buffer. <br>
     * In default, it just draws and return, and you can override it if you need to process the canvas image before drawn.
     * @param  {CanvasRenderingContext2D} bufferContext CanvasRenderingContext2D of double buffer of the layer canvas.
     * @param  {CanvasRenderingContext2D} context CanvasRenderingContext2D of the layer canvas.
     */
    doubleBuffer(bufferContext: any): this;
}
export default CanvasLayer;
