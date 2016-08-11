Z.symbolizer.StrokeAndFillSymbolizer = Z.symbolizer.CanvasSymbolizer.extend({

    defaultSymbol:{
        'lineColor' : '#000000',
        'lineWidth' : 1,
        'lineOpacity' : 1,
        'lineDasharray': [],
        'lineCap' : 'butt', //“butt”, “square”, “round”
        'lineJoin' : 'miter', //“bevel”, “round”, “miter”
        'linePatternFile' : null,
        'polygonFill': null,
        'polygonOpacity': 1,
        'polygonPatternFile' : null
    },

    initialize:function (symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
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
        var canvasResources = this._getRenderResources();
        this._prepareContext(ctx);
        if (Z.Util.isGradient(style['lineColor'])) {
            style['lineGradientExtent'] = this.geometry._getPainter().getContainerExtent()._expand(style['lineWidth'])._round();
        }
        if (Z.Util.isGradient(style['polygonFill'])) {
            style['polygonGradientExtent'] = this.geometry._getPainter().getContainerExtent()._round();
        }

        var points = canvasResources['context'][0],
            isSplitted = (this.geometry instanceof Z.Polygon && points.length === 2 && Z.Util.isArray(points[0][0])) ||
                        (this.geometry instanceof Z.LineString  && points.length === 2 && Z.Util.isArray(points[0]));
        if (isSplitted) {
            for (var i = 0; i < points.length; i++) {
                Z.Canvas.prepareCanvas(ctx, style, resources);
                canvasResources['fn'].apply(this, [ctx].concat([points[i]]).concat([
                    style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']]));
            }
        } else {
            Z.Canvas.prepareCanvas(ctx, style, resources);
            canvasResources['fn'].apply(this, [ctx].concat(canvasResources['context']).concat([
                style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']]));
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

    _getRenderResources:function () {
        return this.geometry._getPainter().getRenderResources();
    },

    translate:function () {
        var s = this.symbol;
        var d = this.defaultSymbol;
        var result = {};
        Z.Util.extend(result, d, s);
        if (result['lineWidth'] === 0) {
            result['lineOpacity'] = 0;
        }
        if (this.geometry instanceof Z.LineString) {
            result['polygonFill'] = result['lineColor'];
        }
        return result;
    }

});

Z.symbolizer.StrokeAndFillSymbolizer.test = function (symbol) {
    if (!symbol) {
        return false;
    }
    for (var p in symbol) {
        if (p.indexOf('polygon') >= 0 || p.indexOf('line') >= 0) {
            return true;
        }
    }
    return false;
};
