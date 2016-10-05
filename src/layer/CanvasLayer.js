/**
 * @classdesc
 * A layer to draw on HTML5 2D Canvas.
 * @class
 * @category layer
 * @extends {maptalks.Layer}
 * @param {String|Number} id - layer's id
 */
Z.CanvasLayer = Z.Layer.extend({

    /**
     * An interface function called only once before the first draw, useful for preparation.
     * @param  {CanvasRenderingContext2D } context - CanvasRenderingContext2D of the layer canvas.
     * @return {Object[]} objects that will be passed to function draw(context, ..) as parameters.
     */
    prepareToDraw: function () {},

    /**
     * The interface function to draw things on the layer canvas.
     * @param  {CanvasRenderingContext2D} context - CanvasRenderingContext2D of the layer canvas.
     * @param  {*} params.. - parameters returned by function prepareToDraw(context).
     */
    draw: function () {},

    /**
     * Ask the map to redraw the layer canvas
     * @return {maptalks.CanvasLayer} this
     */
    requestMapToRender: function () {
        if (this._getRenderer()) {
            this._getRenderer().requestMapToRender();
        }
        return this;
    },

    /**
     * Ask the map to redraw the layer canvas and fire layerload event
     * @return {maptalks.CanvasLayer} this
     */
    completeRender: function () {
        if (this._getRenderer()) {
            this._getRenderer().completeRender();
        }
        return this;
    },

    /**
     * The event callback for map's zoomstart event
     * @param  {Object} param - event parameter
     */
    onZoomStart: function () {},

    /**
     * The event callback for map's zoomend event
     * @param  {Object} param - event parameter
     */
    onZoomEnd: function () {},

    /**
     * The event callback for map's movestart event
     * @param  {Object} param - event parameter
     */
    onMoveStart: function () {},

    /**
     * The event callback for map's moveend event
     * @param  {Object} param - event parameter
     */
    onMoveEnd: function () {},

    /**
     * The event callback for map's resize event
     * @param  {Object} param - event parameter
     */
    onResize: function () {}

});

Z.CanvasLayer.registerRenderer('canvas', Z.renderer.Canvas.extend({
    initialize: function (layer) {
        this.layer = layer;
    },

    draw: function () {
        this.prepareCanvas();
        if (!this._predrawed) {
            this._drawContext = this.layer.prepareToDraw(this.context);
            if (!this._drawContext) {
                this._drawContext = [];
            }
            this._predrawed = true;
        }
        this.layer.draw.apply(this.layer, [this.context].concat(this._drawContext));
        this.completeRender();
    },

    remove: function () {
        delete this._drawContext;
        maptalks.renderer.Canvas.prototype.remove.call(this);
    },

    onZoomStart: function (param) {
        this.layer.onZoomStart(param);
        Z.renderer.Canvas.prototype.onZoomStart.call(this);
    },

    onZoomEnd: function (param) {
        this.layer.onZoomEnd(param);
        Z.renderer.Canvas.prototype.onZoomEnd.call(this);
    },

    onMoveStart: function (param) {
        this.layer.onMoveStart(param);
        Z.renderer.Canvas.prototype.onMoveStart.call(this);
    },

    onMoveEnd: function (param) {
        this.layer.onMoveEnd(param);
        Z.renderer.Canvas.prototype.onMoveEnd.call(this);
    },

    onResize: function (param) {
        this.layer.onResize(param);
        Z.renderer.Canvas.prototype.onResize.call(this);
    }
}));
