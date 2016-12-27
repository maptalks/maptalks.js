/**
 * @classdesc
 * A parent renderer class for OverlayLayer to inherit by OverlayLayer's subclasses.
 * @class
 * @protected
 * @memberOf maptalks.renderer.overlaylayer
 * @name Canvas
 * @extends {maptalks.renderer.Canvas}
 */
maptalks.renderer.overlaylayer.Canvas = maptalks.renderer.Canvas.extend({

    // geometries can be: true | [geometries] | null
    // true: check layer's all geometries if the checking is the first time.
    // [geometries] : the additional geometries needs to be checked.
    // null : no checking.
    //
    // possible memory leaks:
    // 1. if geometries' symbols with external resources change frequently,
    // resources of old symbols will still be stored.
    // 2. removed geometries' resources won't be removed.
    checkResources:function (geometries) {
        if (!this._resourceChecked && !maptalks.Util.isArray(geometries)) {
            geometries = this.layer._geoList;
        }
        if (!geometries || !maptalks.Util.isArrayHasData(geometries)) {
            return [];
        }
        var me = this,
            resources = [];
        var res;
        function checkGeo(geo) {
            res = geo._getExternalResources();
            if (!maptalks.Util.isArrayHasData(res)) {
                return;
            }
            if (!me.resources) {
                resources = resources.concat(res);
            } else {
                for (var ii = 0; ii < res.length; ii++) {
                    if (!me.resources.isResourceLoaded(res[ii])) {
                        resources.push(res[ii]);
                    }
                }
            }
        }

        for (var i = geometries.length - 1; i >= 0; i--) {
            checkGeo(geometries[i]);
        }
        this._resourceChecked = true;
        return resources;
    },

    onGeometryAdd: function (geometries) {
        this.render(geometries);
    },

    onGeometryRemove: function () {
        this.render();
    },

    onGeometrySymbolChange: function (e) {
        this.render([e.target]);
    },

    onGeometryShapeChange: function () {
        this.render();
    },

    onGeometryPositionChange: function () {
        this.render();
    },

    onGeometryZIndexChange: function () {
        this.render();
    },

    onGeometryShow: function () {
        this.render();
    },

    onGeometryHide: function () {
        this.render();
    },

    onGeometryPropertiesChange: function () {
        this.render();
    }
});


/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for VectorLayers
 * @class
 * @protected
 * @memberOf maptalks.renderer.vectorlayer
 * @name Canvas
 * @extends {maptalks.renderer.overlaylayer.Canvas}
 * @param {maptalks.VectorLayer} layer - layer of the renderer
 */
maptalks.renderer.vectorlayer.Canvas = maptalks.renderer.overlaylayer.Canvas.extend(/** @lends maptalks.renderer.vectorlayer.Canvas.prototype */{

    initialize:function (layer) {
        this.layer = layer;
    },

    checkResources: function () {
        var me = this;
        var resources = maptalks.renderer.overlaylayer.Canvas.prototype.checkResources.apply(this, arguments);
        var style = this.layer.getStyle();
        if (style) {
            if (!maptalks.Util.isArray(style)) {
                style = [style];
            }
            style.forEach(function (s) {
                var res = maptalks.Util.getExternalResources(s['symbol'], true);
                if (res) {
                    for (var ii = 0; ii < res.length; ii++) {
                        if (!me.resources.isResourceLoaded(res[ii])) {
                            resources.push(res[ii]);
                        }
                    }
                }
            });
        }
        return resources;
    },

    /**
     * render layer
     * @param  {maptalks.Geometry[]} geometries   geometries to render
     * @param  {Boolean} ignorePromise   whether escape step of promise
     */
    draw:function () {
        if (!this.getMap()) {
            return;
        }
        if (!this.layer.isVisible() || this.layer.isEmpty()) {
            this.clearCanvas();
            this.completeRender();
            return;
        }

        this._drawGeos();

        this.completeRender();
    },

    drawOnZooming: function () {
        for (var i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._paint();
        }
    },

    isBlank: function () {
        return this._isBlank;
    },

    /**
     * Show and render
     * @override
     */
    show: function () {
        this.layer.forEach(function (geo) {
            geo._repaint();
        });
        maptalks.renderer.Canvas.prototype.show.apply(this, arguments);
    },

    isUpdateWhenZooming: function () {
        var map = this.getMap();
        var count = map._getRenderer()._getCountOfGeosToDraw();
        return (this._hasPointSymbolizer && count > 0 && count <= map.options['pointThresholdOfZoomAnimation']);
    },

    _drawGeos:function () {
        var map = this.getMap();
        if (!map) {
            return;
        }
        var layer = this.layer;
        if (layer.isEmpty()) {
            this.fireLoadedEvent();
            return;
        }
        if (!layer.isVisible()) {
            this.fireLoadedEvent();
            return;
        }

        var maskExtent2D = this.prepareCanvas();
        var extent2D = this._extent2D;
        if (maskExtent2D) {
            if (!maskExtent2D.intersects(extent2D)) {
                this.fireLoadedEvent();
                return;
            }
            extent2D = extent2D.intersection(maskExtent2D);
        }
        this._prepareToDraw();
        this._displayExtent = extent2D;
        this._forEachGeo(this._checkGeo, this);
        for (var i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._paint();
        }
    },

    _prepareToDraw: function () {
        this._isBlank = true;
        this._hasPointSymbolizer = false;
        this._geosToDraw = [];
    },

    _checkGeo: function (geo) {
        if (!geo || !geo.isVisible() || !geo.getMap() ||
            !geo.getLayer() || (!geo.getLayer().isCanvasRender())) {
            return;
        }
        var painter = geo._getPainter(),
            extent2D = painter.get2DExtent(this.resources);
        if (!extent2D || !extent2D.intersects(this._displayExtent)) {
            return;
        }
        this._isBlank = false;
        if (painter.hasPointSymbolizer()) {
            this._hasPointSymbolizer = true;
        }
        this._geosToDraw.push(geo);
    },


    _forEachGeo: function (fn, context) {
        this.layer.forEach(fn, context);
    },

    onZooming: function () {
        var map = this.getMap();
        if (this.layer.isVisible() && (map._pitch || this.isUpdateWhenZooming())) {
            this._geosToDraw.forEach(function (geo) {
                geo._removeZoomCache();
            });
        }
        maptalks.renderer.Canvas.prototype.onZooming.apply(this, arguments);
    },

    onZoomEnd: function () {
        delete this._extent2D;
        if (this.layer.isVisible()) {
            this.layer.forEach(function (geo) {
                geo._removeZoomCache();
            });
        }
        maptalks.renderer.Canvas.prototype.onZoomEnd.apply(this, arguments);
    },

    onRemove:function () {
        this._forEachGeo(function (g) {
            g.onHide();
        });
        delete this._geosToDraw;
    },

    onGeometryPropertiesChange: function (param) {
        if (param) {
            this.layer._styleGeometry(param['target']);
        }
    }
});


maptalks.VectorLayer.registerRenderer('canvas', maptalks.renderer.vectorlayer.Canvas);
