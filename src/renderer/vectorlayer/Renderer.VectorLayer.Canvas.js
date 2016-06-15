/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for VectorLayers
 * @class
 * @protected
 * @memberOf maptalks.renderer.vectorlayer
 * @name Canvas
 * @extends {maptalks.renderer.Canvas}
 * @param {maptalks.VectorLayer} layer - layer of the renderer
 */
Z.renderer.vectorlayer.Canvas = Z.renderer.Canvas.extend(/** @lends Z.renderer.vectorlayer.Canvas.prototype */{

    initialize:function (layer) {
        this._layer = layer;
        this._painted = false;
    },

    /**
     * render layer
     * @param  {maptalks.Geometry[]} geometries   geometries to render
     * @param  {Boolean} ignorePromise   whether escape step of promise
     */
    draw:function () {
        var me = this;
        this._clearTimeout();
        if (this._layer.isEmpty()) {
            this._complete();
            return;
        }
        if (this._layer.options['drawImmediate']) {
            this._drawImmediate();
        } else {
            this._renderTimeout = Z.Util.requestAnimFrame(function () {
                me._drawImmediate();
            });
        }
    },

    //redraw all the geometries with transform matrix
    //this may bring low performance if number of geometries is large.
    transform: function (matrix) {
        if (Z.Browser.mobile || !this.getMap().options['layerTransforming'] || this._layer.options['drawOnce'] || this._layer.getMask()) {
            return false;
        }
        //determin whether this layer should be transformed.
        //if all the geometries to render are vectors including polygons and linestrings,
        //disable transforming won't reduce user experience.
        if (!this._hasPointSymbolizer ||
            this.getMap()._getRenderer()._getCountOfGeosToDraw() > this._layer.options['thresholdOfTransforming']) {
            return false;
        }
        this._drawGeos(matrix);
        return true;
    },

    checkResources:function (geometries) {
        if (!this._painted && !geometries) {
            geometries = this._layer._geoCache;
        }
        if (!geometries) {
            return null;
        }
        var me = this,
            resources = [];
        var res, ii;
        function checkGeo(geo) {
            res = geo._getExternalResource();
            if (!Z.Util.isArrayHasData(res)) {
                return;
            }
            if (!me._resources) {
                resources = resources.concat(res);
            } else {
                for (ii = 0; ii < res.length; ii++) {
                    if (!me._resources.isResourceLoaded(res[ii])) {
                        resources.push(res[ii]);
                    }
                }
            }
        }

        if (Z.Util.isArrayHasData(geometries)) {
            for (var i = geometries.length - 1; i >= 0; i--) {
                checkGeo(geometries[i]);
            }
        } else {
            for (var p in geometries) {
                if (geometries.hasOwnProperty(p)) {
                    checkGeo(geometries[p]);
                }
            }
        }
        return resources;
    },


    isBlank: function () {
        return this._isBlank;
    },

    /**
     * Show and render
     * @override
     */
    show: function () {
        this._layer.forEach(function (geo) {
            geo._onZoomEnd();
        });
        Z.renderer.Canvas.prototype.show.apply(this, arguments);
    },

    _drawGeos:function (matrix) {
        var map = this.getMap();
        if (!map) {
            return;
        }
        var layer = this._layer;
        if (layer.isEmpty()) {
            this._resources = new Z.renderer.Canvas.Resources();
            this._fireLoadedEvent();
            return;
        }
        if (!layer.isVisible()) {
            this._fireLoadedEvent();
            return;
        }
        this._prepareToDraw();
        var viewExtent = this._viewExtent,
            maskViewExtent = this._prepareCanvas();
        if (maskViewExtent) {
            if (!maskViewExtent.intersects(viewExtent)) {
                this._fireLoadedEvent();
                return;
            }
            viewExtent = viewExtent.intersection(maskViewExtent);
        }
        this._displayExtent = viewExtent;
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
            viewExtent = painter.getViewExtent();
        if (!viewExtent || !viewExtent.intersects(this._displayExtent)) {
            return;
        }
        this._isBlank = false;
        if (painter.hasPointSymbolizer()) {
            this._hasPointSymbolizer = true;
        }
        this._geosToDraw.push(geo);
    },


    _forEachGeo: function (fn, context) {
        this._layer.forEach(fn, context);
    },

    /**
     * Renderer the layer immediately.
     */
    _drawImmediate:function () {
        this._clearTimeout();
        if (!this.getMap()) {
            return;
        }
        var map = this.getMap();
        if (!this._layer.isVisible() || this._layer.isEmpty()) {
            this._clearCanvas();
            this._complete();
            return;
        }
        var zoom = this.getMap().getZoom();
        if (this._layer.options['drawOnce']) {
            if (!this._canvasCache) {
                this._canvasCache = {};
            }
            if (this._viewExtent) {
                this._complete();
                return;
            } else if (this._canvasCache[zoom]) {
                this._canvas = this._canvasCache[zoom].canvas;
                var center = map._prjToPoint(map._getPrjCenter());
                this._viewExtent = this._canvasCache[zoom].viewExtent.add(this._canvasCache[zoom].center.substract(center));
                this._complete();
                return;
            } else {
                delete this._canvas;
            }
        }
        this._drawGeos();
        if (this._layer.options['drawOnce']) {
            if (!this._canvasCache[zoom]) {
                this._canvasCache[zoom] = {
                    'canvas'       : this._canvas,
                    'viewExtent'   : this._viewExtent,
                    'center'       : map._prjToPoint(map._getPrjCenter())
                };
            }
        }
        this._complete();
    },

    _onZoomEnd: function () {
        delete this._viewExtent;
        if (this._layer.isVisible()) {
            this._layer.forEach(function (geo) {
                geo._onZoomEnd();
            });
        }
        if (!this._painted) {
            this.render();
        } else {
            //_prepareRender is called in render not in _drawImmediate.
            //Thus _prepareRender needs to be called here
            this._prepareRender();
            this._drawImmediate();
        }
    },

    _onMoveEnd: function () {
        if (!this._painted) {
            this.render();
        } else {
            this._prepareRender();
            this._drawImmediate();
        }
    },

    _onResize: function () {
        this._resizeCanvas();
        if (!this._painted) {
            this.render();
        } else {
            delete this._canvasCache;
            delete this._viewExtent;
            this._prepareRender();
            this._drawImmediate();
        }
    },

    _onRemove:function () {
        delete this._canvasCache;
    },

    _clearTimeout:function () {
        if (this._renderTimeout) {
            //clearTimeout(this._renderTimeout);
            Z.Util.cancelAnimFrame(this._renderTimeout);
        }
    }
});


Z.VectorLayer.registerRenderer('canvas', Z.renderer.vectorlayer.Canvas);

