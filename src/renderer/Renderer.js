    /**
 * @namespace
 */
Z.renderer = {};


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
Z.renderer.Canvas = Z.Class.extend(/** @lends maptalks.renderer.Canvas.prototype */{
    isCanvasRender:function () {
        return true;
    },

    render:function () {
        this._prepareRender();
        if (!this.getMap()) {
            return;
        }
        if (!this._layer.isVisible()) {
            this._requestMapToRender();
            this._fireLoadedEvent();
            return;
        }

        this._render.apply(this, arguments);
    },

    remove: function () {
        if (this._onRemove) {
            this._onRemove();
        }
        delete this._canvas;
        delete this._context;
        delete this._viewExtent;
        this._requestMapToRender();
        delete this._layer;
    },

    getMap: function () {
        if (!this._layer) {
            return null;
        }
        return this._layer.getMap();
    },

    getLayer:function () {
        return this._layer;
    },

    getCanvasImage:function () {
        if ((this._layer.isEmpty && this._layer.isEmpty()) || !this._viewExtent) {
            return null;
        }
        if (this.isBlank && this.isBlank()) {
            return null;
        }
        var size = this._viewExtent.getSize();
        var point = this._viewExtent.getMin();
        return {'image':this._canvas, 'layer':this._layer, 'point':this.getMap().viewPointToContainerPoint(point), 'size':size};
    },

    isLoaded:function () {
        if (this._loaded) {
            return true;
        }
        return false;
    },

    /**
     * 显示图层
     */
    show: function () {
        var mask = this._layer.getMask();
        if (mask) {
            mask._onZoomEnd();
        }
        this.render();
    },

    /**
     * 隐藏图层
     */
    hide: function () {
        this._requestMapToRender();
    },

    setZIndex: function () {
        this._requestMapToRender();
    },

    getRenderZoom:function () {
        return this._renderZoom;
    },

    _prepareRender:function () {
        this._renderZoom = this.getMap().getZoom();
        this._viewExtent = this.getMap()._getViewExtent();
        this._loaded = false;
    },

    _requestMapToRender:function () {
        if (this.getMap()) {
            if (this._context) {
                this._layer.fire('renderend', {'context' : this._context});
            }
            this.getMap()._getRenderer().render();
        }
    },

    _fireLoadedEvent:function () {
        this._loaded = true;
        if (this._layer) {
            this._layer.fire('layerload');
        }
    },

    _createCanvas:function () {
        if (this._canvas) {
            return;
        }
        var map = this.getMap();
        var size = map.getSize();
        var r = Z.Browser.retina ? 2 : 1;
        this._canvas = Z.Canvas.createCanvas(r * size['width'], r * size['height'], map.CanvasClass);
        this._context = this._canvas.getContext('2d');
        if (Z.Browser.retina) {
            this._context.scale(2, 2);
        }
        Z.Canvas.setDefaultCanvasSetting(this._context);
    },

    _resizeCanvas:function (canvasSize) {
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
        var r = Z.Browser.retina ? 2 : 1;
        //only make canvas bigger, never smaller
        if (this._canvas.width >= r * size['width'] && this._canvas.height >= r * size['height']) {
            return;
        }
        //retina support
        this._canvas.height = r * size['height'];
        this._canvas.width = r * size['width'];
        if (Z.Browser.retina) {
            this._context.scale(2, 2);
        }
    },

    _clearCanvas:function () {
        if (!this._canvas) {
            return;
        }
        Z.Canvas.clearRect(this._context, 0, 0, this._canvas.width, this._canvas.height);
    },

    _prepareCanvas:function () {
        if (!this._canvas) {
            this._createCanvas();
        } else {
            this._clearCanvas();
        }

        if (this._clipped) {
            this._context.restore();
            this._clipped = false;
        }
        var mask = this.getLayer().getMask();
        if (!mask) {
            return null;
        }
        var maskViewExtent = mask._getPainter().getPixelExtent();
        if (!maskViewExtent.intersects(this._viewExtent)) {
            return maskViewExtent;
        }
        this._context.save();
        mask._getPainter().paint();
        this._context.clip();
        this._clipped = true;
        this._layer.fire('renderstart', {'context' : this._context});
        return maskViewExtent;
    },

    _getEvents: function () {
        return {
            '_zoomend' : this._onZoomEnd,
            '_resize'  : this._onResize,
            '_moveend' : this._onMoveEnd
        };
    },

    _onZoomEnd: function () {
        this.render();
    },

    _onMoveEnd: function () {
        this.render();
    },

    _onResize: function () {
        this._resizeCanvas();
        this.render();
    }
});
