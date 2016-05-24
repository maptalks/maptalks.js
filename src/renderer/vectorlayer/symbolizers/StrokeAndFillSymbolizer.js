Z.symbolizer.StrokeAndFillSymbolizer = Z.symbolizer.CanvasSymbolizer.extend({

    defaultSymbol:{
        'lineColor' : '#000000',
        'lineWidth' : 1,
        'lineOpacity' : 1,
        'lineDasharray': [],
        'lineCap' : 'butt', //“butt”, “square”, “round”
        'lineJoin' : 'round', //“bevel”, “round”, “miter”
        'polygonFill': null,
        'polygonOpacity': 0
    },

    initialize:function (symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.style = this.translate();
        this.strokeAndFill = this.translateStrokeAndFill(this.style);
    },

    symbolize:function (ctx, resources) {
        var canvasResources = this._getRenderResources();
        var strokeAndFill = this.strokeAndFill;
        this._prepareContext(ctx);
        Z.Canvas.prepareCanvas(ctx, strokeAndFill['stroke'], strokeAndFill['fill'], resources);
        canvasResources['fn'].apply(this, [ctx].concat(canvasResources['context']).concat([
            strokeAndFill['stroke']['stroke-opacity'], strokeAndFill['fill']['fill-opacity'], strokeAndFill['stroke']['stroke-dasharray']]));
        if (ctx.setLineDash && Z.Util.isArrayHasData(strokeAndFill['stroke']['stroke-dasharray'])) {
            ctx.setLineDash([]);
        }
    },

    getPixelExtent:function () {
        var map = this.getMap();
        var extent = this.geometry._getPrjExtent();
        if (!extent) {
            return null;
        }
        // var min = map._prjToViewPoint(new Z.Coordinate(extent['xmin'],extent['ymin'])),
        //     max = map._prjToViewPoint(new Z.Coordinate(extent['xmax'],extent['ymax']));
        // return new Z.PointExtent(min,max).expand(this.style['lineWidth']/2);
        //
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
        var min = map._prjToViewPoint(this._extMin),
            max = map._prjToViewPoint(this._extMax);
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
        return this.geometry._getPainter()._getRenderResources();
    },

    translate:function () {
        var s = this.symbol;
        var d = this.defaultSymbol;
        var result = {};
        Z.Util.extend(result, d);
        if (!Z.Util.isNil(s['polygonFill'])) {
            result['polygonOpacity'] = 1;
        }
        Z.Util.extend(result, s);
        if (result['polygonPatternFile']) {
            delete result['polygonFill'];
        }
        if (result['linePatternFile']) {
            delete result['lineColor'];
        }
        return result;
    },

    translateStrokeAndFill:function (s) {
        var result = {
            'stroke' :{
                'stroke' : s['lineColor'] || s['linePatternFile'],
                'stroke-width' : s['lineWidth'],
                'stroke-opacity' : s['lineOpacity'],
                'stroke-dasharray': s['lineDasharray'],
                'stroke-linecap' : s['lineCap'],
                'stroke-linejoin' : s['lineJoin']
            },

            'fill' : {
                'fill'          : s['polygonFill'] || s['polygonPatternFile'],
                'fill-opacity'  : s['polygonOpacity']
            }
        };
        //if linestring has arrow, needs to fill arrow with same color of line-color
        if (this.geometry instanceof Z.LineString && this.geometry.options['arrowStyle']) {
            result['fill'] = {
                'fill'          : result['stroke']['stroke'],
                'fill-opacity'  : result['stroke']['stroke-opacity']
            };
        }
        //vml和svg对linecap的定义不同
        if (result['stroke']['stroke-linecap'] === 'butt') {
            if (Z.Browser.vml) {
                result['stroke']['stroke-linecap'] = 'flat';
            }
        }
        //it has no use to set stroke-width to 0 in canvas, so set stroke-opacity to make it disapear.
        if (result['stroke']['stroke-width'] === 0) {
            result['stroke']['stroke-opacity'] = 0;
        }
        return result;
    }

});

Z.symbolizer.StrokeAndFillSymbolizer.test = function (geometry) {
    if (!geometry) {
        return false;
    }
    var layer = geometry.getLayer();
    if (!layer || !layer.isCanvasRender()) {
        return false;
    }
    if (geometry instanceof Z.Marker) {
        return false;
    }
    return true;
};
