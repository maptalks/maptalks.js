/**
 * @classdesc
 * Painter class for all geometry types except the collection types.
 * @class
 * @protected
 * @param {maptalks.Geometry} geometry - geometry to paint
 */
Z.Painter = Z.Class.extend(/** @lends maptalks.Painter.prototype */{


    initialize:function (geometry) {
        this.geometry = geometry;
        this.symbolizers = this._createSymbolizers();
    },

    getMap:function () {
        return this.geometry.getMap();
    },

    /**
     * 构造symbolizers
     * @return {*} [description]
     */
    _createSymbolizers:function () {
        var geoSymbol = this.getSymbol(),
            symbolizers = [],
            regSymbolizers = Z.Painter.registerSymbolizers,
            symbols = geoSymbol;
        if (!Z.Util.isArray(geoSymbol)) {
            symbols = [geoSymbol];
        }
        var symbol, symbolizer;
        for (var ii = symbols.length - 1; ii >= 0; ii--) {
            symbol = symbols[ii];
            for (var i = regSymbolizers.length - 1; i >= 0; i--) {
                if (regSymbolizers[i].test(symbol)) {
                    symbolizer = new regSymbolizers[i](symbol, this.geometry);
                    symbolizers.push(symbolizer);
                    if (symbolizer instanceof Z.symbolizer.PointSymbolizer) {
                        this._hasPointSymbolizer = true;
                    }
                }
            }
        }
        if (symbolizers.length === 0) {
            throw new Error('no symbolizers can be created to draw, check the validity of the symbol.');
        }
        this._debugSymbolizer = new Z.symbolizer.DebugSymbolizer(symbol, this.geometry);
        this._hasShadow = this.geometry.options['shadowBlur'] > 0;
        return symbolizers;
    },

    hasPointSymbolizer:function () {
        return this._hasPointSymbolizer;
    },

    getTransformMatrix: function () {
        if (this._matrix) {
            return this._matrix;
        }
        return null;
    },

    /**
     * for point symbolizers
     * @return {maptalks.Point[]} points to render
     */
    _getRenderPoints:function (placement) {
        if (!this._renderPoints) {
            this._renderPoints = {};
        }
        if (!placement) {
            placement = 'default';
        }
        if (!this._renderPoints[placement]) {
            this._renderPoints[placement] = this.geometry._getRenderPoints(placement);
        }
        return this._renderPoints[placement];
    },

    /**
     * for strokeAndFillSymbolizer
     * @return {Object[]} resources to render vector
     */
    _getRenderResources:function () {
        if (!this._rendResources) {
            //render resources geometry returned are based on view points.
            this._rendResources = this.geometry._getRenderCanvasResources();
        }
        var matrices = this.getTransformMatrix(),
            matrix = matrices ? matrices['container'] : null,
            scale = matrices ? matrices['scale'] : null;
        var layerPoint = this.geometry.getLayer()._getRenderer()._extent2D.getMin(),
            context = this._rendResources['context'],
            transContext = [],
        //refer to Geometry.Canvas
            points = context[0],
            containerPoints;
        //convert view points to container points needed by canvas
        if (Z.Util.isArray(points)) {
            containerPoints = Z.Util.mapArrayRecursively(points, function (point) {
                var cp = point.substract(layerPoint);
                if (matrix) {
                    return matrix.applyToPointInstance(cp);
                }
                return cp;
            });
        } else if (points instanceof Z.Point) {
            containerPoints = points.substract(layerPoint);
            if (matrix) {
                containerPoints = matrix.applyToPointInstance(containerPoints);
            }
        }
        transContext.push(containerPoints);

        //scale width ,height or radius if geometry has
        for (var i = 1, len = context.length; i < len; i++) {
            if (matrix) {
                if (Z.Util.isNumber(context[i]) || (context[i] instanceof Z.Size)) {
                    if (Z.Util.isNumber(context[i])) {
                        transContext.push(scale.x * context[i]);
                    } else {
                        transContext.push(new Z.Size(context[i].width * scale.x, context[i].height * scale.y));
                    }
                } else {
                    transContext.push(context[i]);
                }
            } else {
                transContext.push(context[i]);
            }
        }

        var resources = {
            'fn' : this._rendResources['fn'],
            'context' : transContext
        };

        return resources;
    },

    getSymbol:function () {
        return this.geometry._getInternalSymbol();
    },

    /**
     * 绘制图形
     */
    paint: function (matrix) {
        var contexts = this.geometry.getLayer()._getRenderer().getPaintContext();
        if (!contexts || !this.symbolizers) {
            return;
        }

        this._matrix = matrix;
        this._prepareShadow(contexts[0]);
        for (var i = this.symbolizers.length - 1; i >= 0; i--) {
            this.symbolizers[i].symbolize.apply(this.symbolizers[i], contexts);
        }
        this._painted = true;
        this._debugSymbolizer.symbolize.apply(this._debugSymbolizer, contexts);
    },

    _prepareShadow: function (ctx) {
        if (this._hasShadow) {
            ctx.shadowBlur = this.geometry.options['shadowBlur'];
            ctx.shadowColor = this.geometry.options['shadowColor'];
        } else {
            ctx.shadowBlur = null;
            ctx.shadowColor = null;
        }
    },

    _eachSymbolizer:function (fn, context) {
        if (!this.symbolizers) {
            return;
        }
        if (!context) {
            context = this;
        }
        for (var i = this.symbolizers.length - 1; i >= 0; i--) {
            fn.apply(context, [this.symbolizers[i]]);
        }
    },

    //需要实现的接口方法
    get2DExtent:function () {
        if (!this._extent2D) {
            if (this.symbolizers) {
                var _extent2D = new Z.PointExtent();
                var len = this.symbolizers.length - 1;
                for (var i = len; i >= 0; i--) {
                    _extent2D._combine(this.symbolizers[i].get2DExtent());
                }
                _extent2D._round();
                this._extent2D = _extent2D;
            }
        }
        return this._extent2D;
    },

    getContainerExtent : function () {
        var map = this.getMap(),
            matrix = this.getTransformMatrix(),
            extent2D = this.get2DExtent();
        var containerExtent = new Z.PointExtent(map._pointToContainerPoint(extent2D.getMin()), map._pointToContainerPoint(extent2D.getMax()));
        if (matrix) {
            //FIXME not right for markers
            var min = matrix['container'].applyToPointInstance(containerExtent.getMin());
            var max = matrix['container'].applyToPointInstance(containerExtent.getMax());
            containerExtent = new Z.PointExtent(min, max);
        }
        return containerExtent;
    },

    setZIndex:function (change) {
        this._eachSymbolizer(function (symbolizer) {
            symbolizer.setZIndex(change);
        });
    },

    show:function () {
        if (!this._painted) {
            var layer = this.geometry.getLayer();
            if (!layer.isCanvasRender()) {
                this.paint();
            }
        } else {
            this.removeCache();
            this._refreshSymbolizers();
            this._eachSymbolizer(function (symbolizer) {
                symbolizer.show();
            });
        }
        this._requestToRender();
    },

    hide:function () {
        this._eachSymbolizer(function (symbolizer) {
            symbolizer.hide();
        });
        this._requestToRender();
    },

    _onZoomEnd:function () {
        this.removeCache();
        this._refreshSymbolizers();
    },

    repaint:function () {
        this.removeCache();
        this._refreshSymbolizers();
        if (this.geometry.isVisible()) {
            this._requestToRender();
        }
    },

    _refreshSymbolizers:function () {
        this._eachSymbolizer(function (symbolizer) {
            symbolizer.refresh();
        });
    },

    _requestToRender:function () {
        var geometry = this.geometry,
            map = geometry.getMap();
        if (!map || map._isBusy()) {
            return;
        }
        var layer = geometry.getLayer(),
            renderer = layer._getRenderer();
        if (!renderer || !(layer instanceof Z.OverlayLayer)) {
            return;
        }
        if (layer.isCanvasRender()) {
            renderer.render([geometry]);
        }
    },

    /**
     * symbol发生变化后, 刷新symbol
     */
    refreshSymbol:function () {
        this.removeCache();
        this._removeSymbolizers();
        this.symbolizers = this._createSymbolizers();
        if (!this.getMap()) {
            return;
        }
        var layer = this.geometry.getLayer();
        if (this.geometry.isVisible() && (layer instanceof Z.VectorLayer)) {
            if (layer.isCanvasRender()) {
                this._requestToRender();
            } else {
                this.paint();
            }
        }
    },

    remove:function () {
        this.removeCache();
        this._removeSymbolizers();
    },

    _removeSymbolizers:function () {
        this._eachSymbolizer(function (symbolizer) {
            symbolizer.remove();
        });
        delete this.symbolizers;
    },

    /**
     * delete painter's caches
     */
    removeCache:function () {
        delete this._renderPoints;
        delete this._rendResources;
        delete this._extent2D;
    }
});

//注册的symbolizer
Z.Painter.registerSymbolizers = [
    Z.symbolizer.StrokeAndFillSymbolizer,
    Z.symbolizer.ImageMarkerSymbolizer,
    Z.symbolizer.VectorPathMarkerSymbolizer,
    Z.symbolizer.VectorMarkerSymbolizer,
    Z.symbolizer.TextMarkerSymbolizer
];
