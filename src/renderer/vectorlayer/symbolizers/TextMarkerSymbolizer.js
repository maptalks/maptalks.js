Z.symbolizer.TextMarkerSymbolizer = Z.symbolizer.PointSymbolizer.extend({
    defaultSymbol:{
        'textFaceName'      : 'monospace',
        'textSize'          : 10,
        'textFont'          : null,
        'textFill'          : '#000000',
        'textOpacity'       : 1,
        'textHaloFill'      : '#ffffff',
        'textHaloRadius'    : 0,
        'textWrapWidth'     : null,
        'textWrapBefore'    : false,
        'textWrapCharacter' : null,
        'textLineSpacing'   : 0,

        'textDx'            : 0,
        'textDy'            : 0,

        'textHorizontalAlignment' : 'middle', //left | middle | right | auto
        'textVerticalAlignment'   : 'middle',   // top | middle | bottom | auto
        'textAlign'               : 'center' //left | right | center | auto
    },

    initialize:function (symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.style = this.translate();
        this.strokeAndFill = this.translateLineAndFill(this.style);
        this._defineStyle(this.style);
        this._defineStyle(this.strokeAndFill);
        var props = this.geometry.getProperties();
        this.textContent = Z.StringUtil.replaceVariable(this.style['textName'], props);
        this.textDesc = this._loadFromCache(this.textContent, this.style);
        if (!this.textDesc) {
            this.textDesc = Z.StringUtil.splitTextToRow(this.textContent, this.style);
            this._storeToCache(this.textContent, this.style, this.textDesc);
        }

    },

    symbolize:function (ctx, resources) {
        var cookedPoints = this._getRenderContainerPoints();
        if (!Z.Util.isArrayHasData(cookedPoints)) {
            return;
        }
        var style = this.style,
            textContent = this.textContent,
            strokeAndFill = this.strokeAndFill;
        this._prepareContext(ctx);
        Z.Canvas.prepareCanvas(ctx, strokeAndFill, resources);
        Z.Canvas.prepareCanvasFont(ctx, style);

        for (var i = 0, len = cookedPoints.length; i < len; i++) {
            Z.Canvas.text(ctx, textContent, cookedPoints[i], style, this.textDesc);
        }
    },

    getPlacement:function () {
        return this.symbol['textPlacement'];
    },

    getDxDy:function () {
        var s = this.style;
        var dx = s['textDx'],
            dy = s['textDy'];
        return new Z.Point(dx, dy);
    },

    getMarkerExtent:function () {
        var dxdy = this.getDxDy(),
            style = this.style,
            size = this.textDesc['size'];
        var alignPoint = Z.StringUtil.getAlignPoint(size, style['textHorizontalAlignment'], style['textVerticalAlignment']);
        var alignW = alignPoint.x, alignH = alignPoint.y;
        return new Z.PointExtent(
            dxdy.add(alignW, alignH),
            dxdy.add(alignW + size['width'], alignH + size['height'])
        );
    },

    translate:function () {
        var s = this.symbol;
        var d = this.defaultSymbol;
        var result = Z.Util.extend({}, d, s);
        result['textName'] = s['textName'];
        return result;
    },

    translateLineAndFill:function (s) {
        return {
            'lineColor' : s['textHaloRadius'] ? s['textHaloFill'] : s['textFill'],
            'lineWidth' : s['textHaloRadius'],
            'lineOpacity' : s['textOpacity'],
            'lineDasharray' : null,
            'lineCap' : 'butt',
            'lineJoin' : 'round',
            'polygonFill' : s['textFill'],
            'polygonOpacity' : s['textOpacity']
        };
    },

    _storeToCache: function (textContent, style, textDesc) {
        if (Z.node) {
            return;
        }
        if (!this.geometry['___text_symbol_cache']) {
            this.geometry['___text_symbol_cache'] = {};
        }
        this.geometry['___text_symbol_cache'][this._genCacheKey(textContent, style)] = textDesc;
    },

    _loadFromCache:function (textContent, style) {
        if (!this.geometry['___text_symbol_cache']) {
            return null;
        }
        return this.geometry['___text_symbol_cache'][this._genCacheKey(textContent, style)];
    },

    _genCacheKey: function (textContent, style) {
        var key = [textContent];
        for (var p in style) {
            if (style.hasOwnProperty(p)) {
                key.push('p=' + style[p]);
            }
        }
        return key.join('-');
    }
});



Z.symbolizer.TextMarkerSymbolizer.test = function (geometry, symbol) {
    if (!geometry || !symbol) {
        return false;
    }
    var layer = geometry.getLayer();
    if (!layer || !layer.isCanvasRender()) {
        return false;
    }
    if (!Z.Util.isNil(symbol['textName'])) {
        return true;
    }
    return false;
};

Z.symbolizer.TextMarkerSymbolizer.getFont = function (style) {
    if (style['textFont']) {
        return style['textFont'];
    } else {
        return style['textSize'] + 'px ' + style['textFaceName'];
    }
};
