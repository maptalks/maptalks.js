Z.symbolizer.TextMarkerSymbolizer = Z.symbolizer.PointSymbolizer.extend({

    initialize:function (symbol, geometry, painter) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        var style = this.translate();
        this.style = this._defineStyle(style);
        this.strokeAndFill = this._defineStyle(this.translateLineAndFill(style));
        var textContent = Z.StringUtil.replaceVariable(this.style['textName'], this.geometry.getProperties());
        this._descText(textContent);
    },

    symbolize:function (ctx, resources) {
        if (this.style['textSize'] === 0 || this.style['textOpacity'] === 0) {
            return;
        }
        var cookedPoints = this._getRenderContainerPoints();
        if (!Z.Util.isArrayHasData(cookedPoints)) {
            return;
        }
        var style = this.style,
            strokeAndFill = this.strokeAndFill;
        var textContent = Z.StringUtil.replaceVariable(this.style['textName'], this.geometry.getProperties());
        this._descText(textContent);
        this._prepareContext(ctx);
        Z.Canvas.prepareCanvas(ctx, strokeAndFill, resources);
        Z.Canvas.prepareCanvasFont(ctx, style);
        var p;
        for (var i = 0, len = cookedPoints.length; i < len; i++) {
            p = cookedPoints[i];
            var origin = this._rotate(ctx, p, this._getRotationAt(i));
            if (origin) {
                p = origin;
            }
            Z.Canvas.text(ctx, textContent, p, style, this.textDesc);
            if (origin) {
                ctx.restore();
            }
        }
    },

    getPlacement:function () {
        return this.symbol['textPlacement'];
    },

    getRotation: function () {
        var r = this.style['textRotation'];
        if (!Z.Util.isNumber(r)) {
            return null;
        }
        //to radian
        return r * Math.PI / 180;
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
        var result = {
            'textName'          : s['textName'],
            'textFaceName'      : Z.Util.getValueOrDefault(s['textFaceName'], 'monospace'),
            'textWeight'        : Z.Util.getValueOrDefault(s['textWeight'], 'normal'), //'bold', 'bolder'
            'textStyle'         : Z.Util.getValueOrDefault(s['textStyle'], 'normal'), //'italic', 'oblique'
            'textSize'          : Z.Util.getValueOrDefault(s['textSize'], 10),
            'textFont'          : Z.Util.getValueOrDefault(s['textFont'], null),
            'textFill'          : Z.Util.getValueOrDefault(s['textFill'], '#000'),
            'textOpacity'       : Z.Util.getValueOrDefault(s['textOpacity'], 1),

            'textHaloFill'      : Z.Util.getValueOrDefault(s['textHaloFill'], '#ffffff'),
            'textHaloRadius'    : Z.Util.getValueOrDefault(s['textHaloRadius'], 0),
            'textHaloOpacity'   : Z.Util.getValueOrDefault(s['textHaloOpacity'], 1),

            'textWrapWidth'     : Z.Util.getValueOrDefault(s['textWrapWidth'], null),
            'textWrapBefore'    : Z.Util.getValueOrDefault(s['textWrapBefore'], false),
            'textWrapCharacter' : Z.Util.getValueOrDefault(s['textWrapCharacter'], null),
            'textLineSpacing'   : Z.Util.getValueOrDefault(s['textLineSpacing'], 0),

            'textDx'            : Z.Util.getValueOrDefault(s['textDx'], 0),
            'textDy'            : Z.Util.getValueOrDefault(s['textDy'], 0),

            'textHorizontalAlignment' : Z.Util.getValueOrDefault(s['textHorizontalAlignment'], 'middle'), //left | middle | right | auto
            'textVerticalAlignment'   : Z.Util.getValueOrDefault(s['textVerticalAlignment'], 'middle'),   // top | middle | bottom | auto
            'textAlign'               : Z.Util.getValueOrDefault(s['textAlign'], 'center') //left | right | center | auto
        };

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

    _descText : function (textContent) {
        this.textDesc = this._loadFromCache(textContent, this.style);
        if (!this.textDesc) {
            this.textDesc = Z.StringUtil.splitTextToRow(textContent, this.style);
            this._storeToCache(textContent, this.style, this.textDesc);
        }
    },

    _storeToCache: function (textContent, style, textDesc) {
        if (Z.node) {
            return;
        }
        if (!this.geometry['___text_symbol_cache']) {
            this.geometry['___text_symbol_cache'] = {};
        }
        this.geometry['___text_symbol_cache'][this._genCacheKey(style)] = textDesc;
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
            if (style.hasOwnProperty(p) && p.length > 4 && p.substring(0, 4) === 'text') {
                key.push(p + '=' + style[p]);
            }
        }
        return key.join('-');
    }
});



Z.symbolizer.TextMarkerSymbolizer.test = function (symbol) {
    if (!symbol) {
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
        return (style['textStyle'] ? style['textStyle'] + ' ' : '') +
            (style['textWeight'] ? style['textWeight'] + ' ' : '') +
            style['textSize'] + 'px ' +
            (style['textFaceName'][0] === '"' ? style['textFaceName'] : '"' + style['textFaceName'] + '"');
    }
};
