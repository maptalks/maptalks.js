Z.CanvasLayer = Z.Layer.extend({
    prepareToDraw: function () {},

    draw: function () {},

    onZoomStart: function () {},

    onZoomEnd: function () {},

    onMoveStart: function () {},

    onMoveEnd: function () {},

    onResize: function () {},

    completeRender: function () {
        if (this._getRenderer()) {
            this._getRenderer().completeRender();
        }
    }

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
        this.requestMapToRender();
        this.fireLoadedEvent();
    },

    remove:function() {
        delete this._drawContext;
        maptalks.renderer.Canvas.prototype.remove.call(this);
    },

    onZoomStart: function (param) {
        this.layer.onZoomStart(param),
        Z.renderer.Canvas.prototype.onZoomStart.call(this);
    },

    onZoomEnd: function (param) {
        this.layer.onZoomEnd(param),
        Z.renderer.Canvas.prototype.onZoomEnd.call(this);
    },

    onMoveStart: function (param) {
        this.layer.onMoveStart(param),
        Z.renderer.Canvas.prototype.onMoveStart.call(this);
    },

    onMoveEnd: function (param) {
        this.layer.onMoveEnd(param),
        Z.renderer.Canvas.prototype.onMoveEnd.call(this);
    },

    onResize: function (param) {
        this.layer.onResize(param),
        Z.renderer.Canvas.prototype.onResize.call(this);
    },
}););
