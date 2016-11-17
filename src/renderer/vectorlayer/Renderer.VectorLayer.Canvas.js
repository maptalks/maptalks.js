/**
 * @classdesc
 * A parent renderer class for OverlayLayer to inherit by OverlayLayer's subclasses.
 * @class
 * @protected
 * @memberOf maptalks.renderer.overlaylayer
 * @name Canvas
 * @extends {maptalks.renderer.Canvas}
 */
Z.renderer.overlaylayer.Canvas = Z.renderer.Canvas.extend({

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
        if (!this._resourceChecked && !Z.Util.isArray(geometries)) {
            geometries = this.layer._geoList;
        }
        if (!geometries || !Z.Util.isArrayHasData(geometries)) {
            return [];
        }
        var me = this,
            resources = [];
        var res;
        function checkGeo(geo) {
            res = geo._getExternalResources();
            if (!Z.Util.isArrayHasData(res)) {
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

    onGeometrySymbolChange: function (geometries) {
        this.render(geometries);
    },

    onGeometryShapeChange: function () {
        this.render();
    },

    onGeometryPositionChange: function () {
        this.render();
    },

    onGeometryZIndexChange: function () {
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
Z.renderer.vectorlayer.Canvas = Z.renderer.overlaylayer.Canvas.extend(/** @lends Z.renderer.vectorlayer.Canvas.prototype */{

    initialize:function (layer) {
        this.layer = layer;
        this._painted = false;
    },

    checkResources: function () {
        var me = this;
        var resources = Z.renderer.overlaylayer.Canvas.prototype.checkResources.apply(this, arguments);
        var style = this.layer.getStyle();
        if (style) {
            if (!Z.Util.isArray(style)) {
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

    //redraw all the geometries with transform matrix
    //this may bring low performance if number of geometries is large.
    transform: function (matrix) {
        if (Z.Browser.mobile || this.layer.getMask()) {
            return false;
        }
        //determin whether this layer should be transformed.
        //if all the geometries to render are vectors including polygons and linestrings,
        //disable transforming won't reduce user experience.
        if (!this._hasPointSymbolizer ||
            this.getMap()._getRenderer()._getCountOfGeosToDraw() > this.layer.options['thresholdOfTransforming']) {
            return false;
        }
        this._drawGeos(matrix);
        return true;
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
            geo.onZoomEnd();
        });
        Z.renderer.Canvas.prototype.show.apply(this, arguments);
    },

    _drawGeos:function (matrix) {
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
        this._prepareToDraw();
        var extent2D = this._extent2D,
            maskExtent2D = this.prepareCanvas();
        if (maskExtent2D) {
            if (!maskExtent2D.intersects(extent2D)) {
                this.fireLoadedEvent();
                return;
            }
            extent2D = extent2D.intersection(maskExtent2D);
        }
        this._displayExtent = extent2D;
        this._forEachGeo(this._checkGeo, this);
        for (var i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._getPainter().paint(matrix);
        }
    },

    _prepareToDraw: function () {
        this._isBlank = true;
        this._painted = true;
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

    onZoomEnd: function () {
        delete this._extent2D;
        if (this.layer.isVisible()) {
            this.layer.forEach(function (geo) {
                geo.onZoomEnd();
            });
        }
        if (!this._painted) {
            this.render(true);
        } else {
            //prepareRender is called in render not in draw.
            //Thus prepareRender needs to be called here
            this.prepareRender();
            this.draw();
        }
    },

    onMoveEnd: function () {
        if (!this._painted) {
            this.render(true);
        } else {
            this.prepareRender();
            this.draw();
        }
    },

    onResize: function () {
        this.resizeCanvas();
        if (!this._painted) {
            this.render(true);
        } else {
            delete this._extent2D;
            this.prepareRender();
            this.draw();
        }
    },

    onRemove:function () {
        delete this._geosToDraw;
    }
});


Z.VectorLayer.registerRenderer('canvas', Z.renderer.vectorlayer.Canvas);
