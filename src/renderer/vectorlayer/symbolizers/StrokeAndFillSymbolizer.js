Z.symbolizer.StrokeAndFillSymbolizer = Z.symbolizer.CanvasSymbolizer.extend({

    defaultSymbol:{
        'lineColor' : '#000000',
        'lineWidth' : 2,
        'lineOpacity' : 1,
        'lineDasharray': [],
        'lineCap' : 'butt', //“butt”, “square”, “round”
        'lineJoin' : 'miter', //“bevel”, “round”, “miter”
        'linePatternFile' : null,
        'polygonFill': null,
        'polygonOpacity': 1,
        'polygonPatternFile' : null
    },

    initialize:function (symbol, geometry, painter) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        if (geometry instanceof Z.Marker) {
            return;
        }
        this.style = this._defineStyle(this.translate());
    },

    symbolize:function (ctx, resources) {
        if (this.geometry instanceof Z.Marker) {
            return;
        }
        var style = this.style;
        if (style['polygonOpacity'] === 0 && style['lineOpacity'] === 0) {
            return;
        }
        var paintParams = this._getPaintParams();
        if (!paintParams) {
            return;
        }
        this._prepareContext(ctx);
        var isGradient = Z.Util.isGradient(style['lineColor']),
            isPath = (this.geometry.constructor === Z.Polygon) || (this.geometry instanceof Z.LineString);
        if (isGradient && (style['lineColor']['places'] || !isPath)) {
            style['lineGradientExtent'] = this.getPainter().getContainerExtent()._expand(style['lineWidth']);
        }
        if (Z.Util.isGradient(style['polygonFill'])) {
            style['polygonGradientExtent'] = this.getPainter().getContainerExtent();
        }

        var points = paintParams[0],
            isSplitted = (this.geometry instanceof Z.Polygon && points.length > 1 && Z.Util.isArray(points[0][0])) ||
                        (this.geometry instanceof Z.LineString  && points.length > 1 && Z.Util.isArray(points[0]));
        var params;
        if (isSplitted) {
            for (var i = 0; i < points.length; i++) {
                Z.Canvas.prepareCanvas(ctx, style, resources);
                if (isGradient && isPath && !style['lineColor']['places']) {
                    this._createGradient(ctx, points[i], style['lineColor']);
                }
                params = [ctx, points[i]];
                if (paintParams.length > 1) {
                    params.push.apply(params, paintParams.slice(1));
                }
                params.push(style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
                this.geometry._paintOn.apply(this.geometry, params);
            }
        } else {
            Z.Canvas.prepareCanvas(ctx, style, resources);
            if (isGradient && isPath && !style['lineColor']['places']) {
                this._createGradient(ctx, points, style['lineColor']);
            }
            params = [ctx];
            params.push.apply(params, paintParams);
            params.push(style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
            this.geometry._paintOn.apply(this.geometry, params);
        }

        if (ctx.setLineDash && Z.Util.isArrayHasData(style['lineDasharray'])) {
            ctx.setLineDash([]);
        }
    },

    get2DExtent:function () {
        if (this.geometry instanceof Z.Marker) {
            return null;
        }
        var map = this.getMap();
        var extent = this.geometry._getPrjExtent();
        if (!extent) {
            return null;
        }
        // this ugly implementation is to improve perf as we can
        // it tries to avoid creating instances to save cpu consumption.
        if (!this._extMin || !this._extMax) {
            this._extMin = new Z.Coordinate(0, 0);
            this._extMax = new Z.Coordinate(0, 0);
        }
        this._extMin.x = extent['xmin'];
        this._extMin.y = extent['ymin'];
        this._extMax.x = extent['xmax'];
        this._extMax.y = extent['ymax'];
        var min = map._prjToPoint(this._extMin),
            max = map._prjToPoint(this._extMax);
        if (!this._pxExtent) {
            this._pxExtent = new Z.PointExtent(min, max);
        } else {
            if (min.x < max.x) {
                this._pxExtent['xmin'] = min.x;
                this._pxExtent['xmax'] = max.x;
            } else {
                this._pxExtent['xmax'] = min.x;
                this._pxExtent['xmin'] = max.x;
            }
            if (min.y < max.y) {
                this._pxExtent['ymin'] = min.y;
                this._pxExtent['ymax'] = max.y;
            } else {
                this._pxExtent['ymax'] = min.y;
                this._pxExtent['ymin'] = max.y;
            }
        }
        return this._pxExtent._expand(this.style['lineWidth'] / 2);
    },

    _getPaintParams:function () {
        return this.getPainter().getPaintParams();
    },

    translate:function () {
        var s = this.symbol;
        var d = this.defaultSymbol;
        var result = {};
        Z.Util.extend(result, d, s);
        if (result['lineWidth'] === 0) {
            result['lineOpacity'] = 0;
        }
        // if (this.geometry instanceof Z.LineString) {
        //     result['polygonFill'] = result['lineColor'];
        // }
        return result;
    },

    _createGradient: function (ctx, points, lineColor) {
        var len = points.length;
        var grad = ctx.createLinearGradient(points[0].x, points[0].y, points[len - 1].x, points[len - 1].y);
        lineColor['colorStops'].forEach(function (stop) {
            grad.addColorStop.apply(grad, stop);
        });
        ctx.strokeStyle = grad;
    }

});

Z.symbolizer.StrokeAndFillSymbolizer.test = function (symbol, geometry) {
    if (!symbol) {
        return false;
    }
    if (geometry && (geometry instanceof Z.Marker)) {
        return false;
    }
    for (var p in symbol) {
        var f = p.slice(0, 4);
        if (f === 'line' || f === 'poly') {
            return true;
        }
    }
    return false;
};
