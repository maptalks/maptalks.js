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
                if (regSymbolizers[i].test(symbol, this.geometry)) {
                    symbolizer = new regSymbolizers[i](symbol, this.geometry, this);
                    symbolizers.push(symbolizer);
                    if (symbolizer instanceof Z.symbolizer.PointSymbolizer) {
                        this._hasPointSymbolizer = true;
                    }
                }
            }
        }
        if (symbolizers.length === 0) {
            if (console) {
                console.warn('invalid symbol for geometry(' + (this.geometry ? this.geometry.getType() + (this.geometry.getId() ? ':' + this.geometry.getId() : '') : '') + ') to draw : ' + JSON.stringify(geoSymbol));
            }
            // throw new Error('no symbolizers can be created to draw, check the validity of the symbol.');
        }
        this._debugSymbolizer = new Z.symbolizer.DebugSymbolizer(symbol, this.geometry, this);
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
    getRenderPoints:function (placement) {
        if (!this._renderPoints) {
            this._renderPoints = {};
        }
        if (!placement) {
            placement = 'point';
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
    getPaintParams:function () {
        if (!this._paintParams) {
            //render resources geometry returned are based on view points.
            this._paintParams = this.geometry._getPaintParams();
        }
        var matrices = this.getTransformMatrix(),
            matrix = matrices ? matrices['container'] : null,
            scale = matrices ? matrices['scale'] : null;
        var layerPoint = this.geometry.getLayer()._getRenderer()._extent2D.getMin(),
            paintParams = this._paintParams,
            tPaintParams = [], // transformed params
        //refer to Geometry.Canvas
            points = paintParams[0],
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
        tPaintParams.push(containerPoints);

        //scale width ,height or radius if geometry has
        for (var i = 1, len = paintParams.length; i < len; i++) {
            if (matrix) {
                if (Z.Util.isNumber(paintParams[i]) || (paintParams[i] instanceof Z.Size)) {
                    if (Z.Util.isNumber(paintParams[i])) {
                        tPaintParams.push(scale.x * paintParams[i]);
                    } else {
                        tPaintParams.push(new Z.Size(paintParams[i].width * scale.x, paintParams[i].height * scale.y));
                    }
                } else {
                    tPaintParams.push(paintParams[i]);
                }
            } else {
                tPaintParams.push(paintParams[i]);
            }
        }

        return tPaintParams;
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
        this.symbolize(matrix, contexts);
    },

    symbolize: function (matrix, contexts) {
        this._prepareShadow(contexts[0]);
        for (var i = this.symbolizers.length - 1; i >= 0; i--) {
            this.symbolizers[i].symbolize.apply(this.symbolizers[i], contexts);
        }
        this._painted = true;
        this._debugSymbolizer.symbolize.apply(this._debugSymbolizer, contexts);
    },

    getSprite: function (resources) {
        if (!(this.geometry instanceof Z.Marker)) {
            return null;
        }
        this._genSprite = true;
        if (!this._sprite && this.symbolizers.length > 0) {
            var extent = new Z.PointExtent();
            this.symbolizers.forEach(function (s) {
                var markerExtent = s.getMarkerExtent(resources);
                extent._combine(markerExtent);
            });
            var origin = extent.getMin().multi(-1);
            var canvas = Z.Canvas.createCanvas(extent.getWidth(), extent.getHeight(), this.getMap() ? this.getMap().CanvasClass : null);
            var bak;
            if (this._renderPoints) {
                bak = this._renderPoints;
            }
            var contexts = [canvas.getContext('2d'), resources];
            this._prepareShadow(canvas.getContext('2d'));
            for (var i = this.symbolizers.length - 1; i >= 0; i--) {
                var dxdy = this.symbolizers[i].getDxDy();
                this._renderPoints = {'point' : [[origin.add(dxdy)]]};
                this.symbolizers[i].symbolize.apply(this.symbolizers[i], contexts);
            }
            if (bak) {
                this._renderPoints = bak;
            }
            this._sprite = {
                'canvas' : canvas,
                'offset' : extent.getCenter()
            };
        }
        this._genSprite = false;
        return this._sprite;
    },

    isSpriting: function () {
        return this._genSprite;
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
    get2DExtent:function (resources) {
        if (!this._extent2D) {
            if (this.symbolizers) {
                var _extent2D = new Z.PointExtent();
                var len = this.symbolizers.length - 1;
                for (var i = len; i >= 0; i--) {
                    _extent2D._combine(this.symbolizers[i].get2DExtent(resources));
                }
                this._extent2D = _extent2D;
            }
        }
        return this._extent2D;
    },

    getContainerExtent : function () {
        var map = this.getMap(),
            matrix = this.getTransformMatrix(),
            extent2D = this.get2DExtent(this.resources);
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

    onZoomEnd:function () {
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

    _requestToRender:function (isCheckRes) {
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
            renderer.render(isCheckRes ? [geometry] : null);
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
                this._requestToRender(true);
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
            delete symbolizer.painter;
            symbolizer.remove();
        });
        delete this.symbolizers;
    },

    /**
     * delete painter's caches
     */
    removeCache:function () {
        delete this._renderPoints;
        delete this._paintParams;
        delete this._extent2D;
        delete this._sprite;
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
