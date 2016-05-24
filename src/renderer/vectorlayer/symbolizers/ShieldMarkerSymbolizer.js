Z.symbolizer.ShieldMarkerSymbolizer = Z.symbolizer.PointSymbolizer.extend({
    defaultSymbol:{
        'shieldFile'       : null,
        'shieldOpacity'    :  1,
        'shieldDx'         :  0,
        'shieldDy'         :  0,

        'shieldFaceName'  : 'monospace',
        'shieldSize'       :  10,
        'shieldFill'       : '#000000',
        'shieldTextOpacity': 1,
        'shieldHaloFill'  : '#ffffff',
        'shieldHaloRadius': 0,

        'shieldTextDx'    :  0,
        'shieldTextDy'    :  0,

        'shieldHorizontalAlignment'   : 'middle', //left | middle | right | auto
        'shieldVerticalAlignment'     : 'middle',   // top | middle | bottom | auto
        'shieldJustifyAlignment'      : 'left' //left | right | center | auto
    },

    initialize:function (symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.style = this.translate();
        this.strokeAndFill = this.translateStrokeAndFill(this.style);
        var props = this.geometry.getProperties();
        this.textContent = Z.StringUtil.replaceVariable(this.style['shieldName'], props);
        this.textDesc = Z.StringUtil.splitTextToRow(this.textContent, this.style);
        this.shieldFileWidth = 0;
        this.shieldFileHeight = 0;
    },

    symbolize:function (ctx, resources) {
        var cookedPoints = this._getRenderContainerPoints();
        if (!Z.Util.isArrayHasData(cookedPoints)) {
            return;
        }
        var style = this.style,
            strokeAndFill = this.strokeAndFill;
        this._prepareContext(ctx);
        Z.Canvas.prepareCanvas(ctx, strokeAndFill['stroke'], strokeAndFill['fill'], resources);
        Z.Canvas.prepareCanvasFont(ctx, style);

        var img;
        if (style['shieldFile'] && resources) {
            img = resources.getImage(style['shieldFile']);
            if (!img) {
                console.warn(style['shieldFile'] + ' is invalid');
            }
        }
        this.shieldFileWidth = img ? img.width : 0;
        this.shieldFileHeight = img ? img.height : 0;
        for (var i = 0, len = cookedPoints.length; i < len; i++) {
            var pt = cookedPoints[i];
            Z.Canvas.shield(ctx, pt, img, this.textContent, this.textDesc, style);
        }
    },

    getPlacement:function () {
        return this.symbol['shieldPlacement'];
    },

    getDxDy:function () {
        var s = this.style;
        var dx = s['shieldDx'],
            dy = s['shieldDy'];
        return new Z.Point(dx, dy);
    },

    getMarkerExtent:function () {
        var dxdy = this.getDxDy(),
            style = this.style,
            size = this.textDesc['size'];
        var fileExtent = new Z.PointExtent(dxdy.add(new Z.Point(-this.shieldFileWidth / 2, -this.shieldFileHeight / 2)),
                    dxdy.add(new Z.Point(this.shieldFileWidth / 2, this.shieldFileHeight / 2)));
        var textDxDy = new Z.Point(this.style['textDx'], this.style['textDy']);
        var ptAlign = Z.StringUtil.getAlignPoint(size, style['textHorizontalAlignment'], style['textVerticalAlignment']);
        var textExtent = new Z.PointExtent(
            textDxDy.add(ptAlign),
            textDxDy.add(new Z.Point(ptAlign.x + size['width'], ptAlign.y + size['height']))
        );
        return fileExtent.combine(textExtent);
    },

    translate:function () {
        var s = this.symbol;
        var d = this.defaultSymbol;
        var result =  {
            'shieldName'       : s['shieldName'],

            'shieldFile'       : Z.Util.getValueOrDefault(s['shieldFile'], d['shieldFile']),
            'shieldOpacity'    :  Z.Util.getValueOrDefault(s['shieldOpacity'], d['shieldOpacity']),

            'shieldDx'         :  Z.Util.getValueOrDefault(s['shieldDx'], d['shieldDx']),
            'shieldDy'         :  Z.Util.getValueOrDefault(s['shieldDy'], d['shieldDy']),

            'textFaceName'  : Z.Util.getValueOrDefault(s['shieldFaceName'], d['shieldFaceName']),
            'textSize'       : Z.Util.getValueOrDefault(s['shieldSize'], d['shieldSize']),
            'textFill'       : Z.Util.getValueOrDefault(s['shieldFill'], d['shieldFill']),
            'textOpacity'    : Z.Util.getValueOrDefault(s['shieldTextOpacity'], d['shieldTextOpacity']),
            'textHaloFill'  : Z.Util.getValueOrDefault(s['shieldHaloFill'], d['shieldHaloFill']),
            'textHaloRadius': Z.Util.getValueOrDefault(s['shieldHaloRadius'], d['shieldHaloRadius']),
            'textLineSpacing': 0,

            'textDx'    :  Z.Util.getValueOrDefault(s['shieldTextDx'], d['shieldTextDx']),
            'textDy'    :  Z.Util.getValueOrDefault(s['shieldTextDy'], d['shieldTextDy']),

            'textHorizontalAlignment'   : Z.Util.getValueOrDefault(s['shieldHorizontalAlignment'], d['shieldHorizontalAlignment']),
            'textVerticalAlignment'     : Z.Util.getValueOrDefault(s['shieldVerticalAlignment'], d['shieldVerticalAlignment']),
            'textAlign'                  : Z.Util.getValueOrDefault(s['shieldJustifyAlignment'], d['shieldJustifyAlignment'])
        };
        return result;
    },

    translateStrokeAndFill:function (s) {
        var result = {
            'stroke' :{
                'stroke' : s['textHaloFill'],
                'stroke-width' : s['textHaloRadius'],
                'stroke-opacity' : s['textOpacity'],
                'stroke-dasharray': null,
                'stroke-linecap' : 'butt',
                'stroke-linejoin' : 'round'
            },

            'fill' : {
                'fill'          : s['textFill' ],
                'fill-opacity'  : s['textOpacity']
            }
        };
        //vml和svg对linecap的定义不同
        if (result['stroke']['stroke-linecap'] === 'butt') {
            if (Z.Browser.vml) {
                result['stroke']['stroke-linecap'] = 'flat';
            }
        }
        return result;
    }

});



Z.symbolizer.ShieldMarkerSymbolizer.test = function (geometry, symbol) {
    if (!geometry || !symbol) {
        return false;
    }
    var layer = geometry.getLayer();
    if (!layer || !layer.isCanvasRender()) {
        return false;
    }
    if (!Z.Util.isNil(symbol['shieldName']) || !Z.Util.isNil(symbol['shieldFile'])) {
        return true;
    }
    return false;
};
