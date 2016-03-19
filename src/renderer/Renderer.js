/**
 * @namespace
 */
Z.renderer={};

/**
 * @classdesc
 * Base Class for all the renderer based on HTML5 Canvas2D
 * @abstract
 * @class
 * @protected
 * @memberOf maptalks.renderer
 * @name Canvas
 * @extends {maptalks.Class}
 */
Z.renderer.Canvas=Z.Class.extend(/** @lends maptalks.renderer.Canvas.prototype */{
    isCanvasRender:function() {
        return true;
    },

    getMap: function() {
        return this._layer.getMap();
    },

    getLayer:function() {
        return this._layer;
    },

    isLoaded:function() {
        if (this._loaded == false) {
            return false;
        }
        return true;
    },

    _createCanvas:function() {
        if (this._canvas) {
            return;
        }
        var map = this.getMap();
        var size = map.getSize();
        var r = Z.Browser.retina?2:1;
        this._canvas = Z.Canvas.createCanvas(r*size['width'],r*size['height'],map.CanvasClass);
        this._context = this._canvas.getContext('2d');
        if (Z.Browser.retina) {
            this._context.scale(2, 2);
        }
        this._resizeCanvas();
    },

    _resizeCanvas:function(canvasSize) {
        if (!this._canvas) {
            return;
        }
        var size;
        if (!canvasSize) {
            var map = this.getMap();
            size = map.getSize();
        } else {
            size = canvasSize;
        }
        var canvas = this._canvas;
        //retina support
        var r = Z.Browser.retina?2:1;
        canvas.height = r * size['height'];
        canvas.width = r * size['width'];
        if (canvas.style) {
            canvas.style.width = size['width']+'px';
            canvas.style.height = size['height']+'px';
        }
    },

    _clearCanvas:function() {
        if (!this._canvas) {
            return;
        }
        Z.Canvas.clearRect(this._context, 0, 0, this._canvas.width, this._canvas.height);
    },

    _prepareCanvas:function(viewExtent) {
        if (!this._canvas) {
            this._createCanvas();
        } else {
            this._clearCanvas();
        }
        this._renderZoom = this.getMap().getZoom();
        if (this._clipped) {
            this._context.restore();
            this._clipped=false;
        }
        var mask = this.getLayer().getMask();
        if (!mask) {
            return null;
        }
        var maskViewExtent = mask._getPainter().getPixelExtent();
        if (!maskViewExtent.intersects(viewExtent)) {
            return null;
        }
        this._context.save();
        mask._getPainter().paint();
        this._context.clip();
        this._clipped = true;
        return maskViewExtent;
    },

    getRenderZoom:function() {
        return this._renderZoom;
    }
});
