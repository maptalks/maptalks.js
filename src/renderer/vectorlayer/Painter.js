/**
 * @classdesc
 * Painter class for all geometry types except the collection types.
 * @class
 * @protected
 * @param {maptalks.Geometry} geometry - geometry to paint
 */
Z.Painter = Z.Class.extend(/** @lends maptalks.Painter.prototype */{


    initialize:function(geometry) {
        this.geometry = geometry;
        this.symbolizers = this._createSymbolizers();
    },

    getMap:function() {
        return this.geometry.getMap();
    },

    /**
     * 构造symbolizers
     * @return {*} [description]
     */
    _createSymbolizers:function() {
        var geoSymbol = this._getSymbol();
        var symbolizers = [];
        var regSymbolizers = Z.Painter.registerSymbolizers;
        var symbols = geoSymbol;
        if (!Z.Util.isArray(geoSymbol)) {
            symbols = [geoSymbol];
        }
        for (var ii = 0; ii < symbols.length; ii++) {
            var symbol = symbols[ii];
            for (var i = regSymbolizers.length - 1; i >= 0; i--) {
                if (regSymbolizers[i].test(this.geometry, symbol)) {
                    var symbolizer = new regSymbolizers[i](symbol, this.geometry);
                    symbolizers.push(symbolizer);
                    if (symbolizer instanceof Z.symbolizer.PointSymbolizer) {
                        this._hasPointSymbolizer = true;
                    }
                }
            }
        }
        if (symbolizers.length === 0) {
            throw new Error("no symbolizers can be created to draw, check the validity of the symbol.");
        }
        this._debugSymbolizer = new Z.symbolizer.DebugSymbolizer(symbol, this.geometry);
        return symbolizers;
    },

    hasPointSymbolizer:function() {
        return this._hasPointSymbolizer;
    },

    getTransformMatrix: function() {
        if (this._matrix) {
            return this._matrix;
        }
        return null;
    },

    /**
     * for point symbolizers
     * @return {maptalks.Point[]} points to render
     */
    _getRenderPoints:function(placement) {
        if (!this._renderPoints) {
            this._renderPoints = {};
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
    _getRenderResources:function() {
        if (!this._rendResources) {
            //render resources geometry returned are based on view points.
            this._rendResources = this.geometry._getRenderCanvasResources();
        }
        var matrices = this.getTransformMatrix(),
            matrix = matrices?matrices['container']:null,
            scale = matrices?matrices['scale']:null;
        var map = this.getMap(),
            layer = this.geometry.getLayer(),
            context =this._rendResources['context'],
            transContext = [],
        //refer to Geometry.Canvas
            points = context[0],
            containerPoints;
        //convert view points to container points needed by canvas
        if (Z.Util.isArray(points)) {
            containerPoints = Z.Util.eachInArray(points, this, function(point) {
                var cp = map.viewPointToContainerPoint(point);
                if (matrix) {
                    return matrix.applyToPointInstance(cp);
                }
                return cp;
            });
        } else if (points instanceof Z.Point) {
            containerPoints = map.viewPointToContainerPoint(points);
            if (matrix) {
                containerPoints = matrix.applyToPointInstance(containerPoints);
            }
        }
        transContext.push(containerPoints);

        //scale width ,height or radius if geometry has
        for (var i = 1, len = context.length;i<len;i++) {
            if (matrix) {
                if (Z.Util.isNumber(context[i]) || (context[i] instanceof Z.Size)) {
                    if (Z.Util.isNumber(context[i])) {
                        transContext.push(scale.x*context[i]);
                    } else {
                        transContext.push(new Z.Size(context[i].width*scale.x, context[i].height*scale.y));
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

    _getSymbol:function() {
        return this.geometry._getInternalSymbol();
    },

    /**
     * 绘制图形
     */
    paint: function(matrix) {
        var contexts = this.geometry.getLayer()._getRenderer().getPaintContext();
        if (!contexts || !this.symbolizers) {
            return;
        }
        this._matrix = matrix;
        var layer = this.geometry.getLayer();
        var args = contexts.concat([this]);
        for (var i = this.symbolizers.length - 1; i >= 0; i--) {
            var symbolizer = this.symbolizers[i];
            symbolizer.symbolize.apply(symbolizer, args);
        }
        this._painted = true;
        this._debugSymbolizer.symbolize.apply(this._debugSymbolizer, args);
    },

    _eachSymbolizer:function(fn,context) {
        if (!this.symbolizers) {
            return;
        }
        if (!context) {
            context = this;
        }
        for (var i = this.symbolizers.length - 1; i >= 0; i--) {
            fn.apply(context,[this.symbolizers[i]]);
        }
    },

    //需要实现的接口方法
    getPixelExtent:function() {
        if (!this._viewExtent) {
            if (this.symbolizers) {
                var viewExtent = new Z.PointExtent();
                var len = this.symbolizers.length - 1;
                for (var i = len; i >= 0; i--) {
                    viewExtent._combine(this.symbolizers[i].getPixelExtent());
                }
                viewExtent._round();
                this._viewExtent = viewExtent;
            }
        }
        return this._viewExtent;
    },

    setZIndex:function(change) {
        this._eachSymbolizer(function(symbolizer) {
            symbolizer.setZIndex(change);
        });
    },

    show:function(){
        if (!this._painted) {
            var layer = this.geometry.getLayer();
            if (!layer.isCanvasRender()) {
                this.paint();
            }
        } else {
            this._removeCache();
            this._refreshSymbolizers();
            this._eachSymbolizer(function(symbolizer) {
                symbolizer.show();
            });
        }
        this._requestToRender();
    },

    hide:function(){
        this._eachSymbolizer(function(symbolizer) {
            symbolizer.hide();
        });
        this._requestToRender();
    },

    onZoomEnd:function() {
        this._removeCache();
        this._refreshSymbolizers();
    },

    repaint:function(){
        this._removeCache();
        this._refreshSymbolizers();
        if (this.geometry.isVisible()) {
            this._requestToRender();
        }
    },

    _refreshSymbolizers:function() {
        this._eachSymbolizer(function(symbolizer) {
            symbolizer.refresh();
        });
    },

    _requestToRender:function() {
        var geometry = this.geometry,
            map = geometry.getMap();
        if (!map || map._isBusy()) {
            return;
        }
        var layer = geometry.getLayer(),
            renderer = layer._getRenderer();
        if (!renderer) {
            return;
        }
        if (layer.isCanvasRender()) {
            renderer.render([geometry]);
        }
    },

    /**
     * symbol发生变化后, 刷新symbol
     */
    refreshSymbol:function() {
        this._removeCache();
        this._removeSymbolizers();
        this.symbolizers = this._createSymbolizers();
        if (!this.getMap()) {
            return;
        }
        if (this.geometry.isVisible()) {
            var layer = this.geometry.getLayer();
            if (layer.isCanvasRender()) {
                this._requestToRender();
            } else {
                this.paint();
            }
        }
    },

    remove:function() {
        this._removeCache();
        this._removeSymbolizers();
    },

    _removeSymbolizers:function() {
        this._eachSymbolizer(function(symbolizer) {
            symbolizer.remove();
        });
        delete this.symbolizers;
    },

    /**
     * 删除缓存属性
     */
    _removeCache:function() {
        delete this._renderPoints;
        delete this._rendResources;
        delete this._viewExtent;
    }
});

//注册的symbolizer
Z.Painter.registerSymbolizers = [
        Z.symbolizer.StrokeAndFillSymbolizer,
        Z.symbolizer.ImageMarkerSymbolizer,
        Z.symbolizer.VectorMarkerSymbolizer,
        Z.symbolizer.VectorPathMarkerSymbolizer,
        Z.symbolizer.TextMarkerSymbolizer
    ];
