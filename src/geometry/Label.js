/**
 * label控件
 * @class maptalks.Label
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z.Label = Z.Marker.extend({
    defaultSymbol : {
        "textFaceName"  : "monospace",
        "textSize": 12,
        "textWrapBefore": false,
        "textWrapCharacter": "\n",
        "textLineSpacing": 8,
        "textHorizontalAlignment": "middle",//left middle right
        "textVerticalAlignment": "middle" //top middle bottom
    },

    defaultBoxSymbol:{
        "markerType":"square",
        "markerLineColor": "#ff0000",
        "markerLineWidth": 2,
        "markerLineOpacity": 0.9,
        "markerFill": "#ffffff"
    },

    /**
     * @cfg {Object} options label属性
     */
    options: {
        'draggable'    :   false,
        //是否绘制背景边框
        'box'          :   true,
        'boxAutoSize'  :   true,
        'boxMinWidth'  :   0,
        'boxMinHeight' :   0,
        'boxPadding'   :   new Z.Size(12,8),
        'boxTextAlign' :   'middle'
    },

    /**
     * 初始化Label
     * @constructor
     * @param {String} content Label文字内容
     * @param {Coordinate} coordinates Label坐标
     * @param {Object} options 配置, 与Marker的options配置相同
     * @return {maptalks.Label}
     * @expose
     */
    initialize: function (content, coordinates, options) {
        this._content = content;
        this._coordinates = new Z.Coordinate(coordinates);
        this._initOptions(options);
        this._registerEvents();
        this._refresh();
    },

    /**
     * 获取label内容
     */
    getContent: function() {
        return this._content;
    },

    /**
     * 设置label内容
     */
    setContent: function(content) {
        this._content = content;
        this._refresh();
        this.fire('contentchange', {target:this});
        return this;
    },

    setSymbol:function(symbol) {
        if (!symbol || symbol === this.options['symbol']) {
           symbol = {};
        }
       var camelSymbol = this._prepareSymbol(symbol);
       var s = {};
       Z.Util.extend(s, this.defaultSymbol);
       if (this.options['box']) {
            Z.Util.extend(s, this.defaultBoxSymbol);
       }
       Z.Util.extend(s,camelSymbol);
       this._symbol = s;
       this._refresh();
       return this;
    },

    toJSON:function(options) {
        if (!options) {
            options = {};
        }
        var json = {
            "feature" : this.toGeoJSON(options),
            "subType" : "Label",
            "content" : this._content
        };
        var other = this._exportGraphicOptions(options);
        Z.Util.extend(json,other);
        return json;
    },

    onConfig:function(conf) {
        var isRefresh = false;
        for (var p in conf) {
            if (conf.hasOwnProperty(p)) {
                if (p.indexOf('box') >= 0) {
                    isRefresh = true;
                    break;
                }
            }
        }
        if (isRefresh) {
            this._refresh();
        }
    },

    _refresh:function() {
        var symbol = this.getSymbol();
        symbol['textName'] = this._content;
        if (this.options['box']) {
            if (!symbol['markerType']) {
                symbol['markerType'] = 'square';
            }
            var size;
            var padding = this.options['boxPadding'];
            if (this.options['boxAutoSize'] || this.options['boxTextAlign']) {
                size = Z.StringUtil.splitTextToRow(this._content, symbol)['size'];
            }
            if (this.options['boxAutoSize']) {
                symbol['markerWidth'] = size['width']+padding['width']*2;
                symbol['markerHeight'] = size['height']+padding['height']*2;
            }
            if (this.options['boxMinWidth']) {
                if (!symbol['markerWidth'] || symbol['markerWidth'] < this.options['boxMinWidth']) {
                    symbol['markerWidth'] = this.options['boxMinWidth'];
                }
            }
            if (this.options['boxMinHeight']) {
                if (!symbol['markerHeight'] || symbol['markerHeight'] < this.options['boxMinHeight']) {
                    symbol['markerHeight'] = this.options['boxMinHeight'];
                }
            }
            var align = this.options['boxTextAlign'];
            if (align) {
                //背景和文字之间的间隔距离
                var textAlignPoint = Z.StringUtil.getAlignPoint(size, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment']);
                textAlignPoint = textAlignPoint._add(new Z.Point(Z.Util.getValueOrDefault(symbol['textDx'],0),Z.Util.getValueOrDefault(symbol['textDy'],0)));
                symbol['markerDx'] = textAlignPoint.x;
                symbol['markerDy'] = textAlignPoint.y + size['height']/2;
                if (align === 'left') {
                   symbol['markerDx'] += symbol['markerWidth']/2 - padding['width'];
                } else if (align === 'right') {
                   symbol['markerDx'] -= symbol['markerWidth']/2 - size['width'] - padding['width'];
                } else {
                    symbol['markerDx'] += size['width']/2;
                }
            }
        }
        this._symbol = symbol;
        this._onSymbolChanged();
    },

    _registerEvents: function() {
        this.on('shapechange', this._refresh, this);
        this.on('remove', this._onLabelRemove, this);
        return this;
    },

    _onLabelRemove:function() {
        this.off('shapechange', this._refresh, this);
        this.off('remove', this._onLabelRemove,this);
    }
});

Z.Label._fromJSON=function(json) {
    var feature = json['feature'];
    var label = new Z.Label(json['content'], feature['geometry']['coordinates'], json['options']);
    label.setProperties(feature['properties']);
    return label;
}
