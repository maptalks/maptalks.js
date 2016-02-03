/**
 * label控件
 * @class maptalks.Label
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z.Label = Z.Marker.extend({
    defaultSymbol : {
        "textFaceName": "arial",
        "textSize": 12,
        "textFill": "#000000",
        "textOpacity": 1,
        "textSpacing": 30,
        "textWrapWidth": null,
        "textWrapBefore": false,
        "textWrapCharacter": "\n",
        "textLineSpacing": 8,
        "textHorizontalAlignment": "middle",//left middle right
        "textVerticalAlignment": "middle", //top middle bottom
    },

    defaultBoxSymbol:{
        "markerType":"square",
        "markerLineColor": "#ff0000",
        "markerLineWidth": 2,
        "markerLineOpacity": 0.9,
        "markerLineDasharray": null,
        "markerFill": "#ffffff",
        "markerFillOpacity": 1
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
        'textAlign'    :   'center'
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

    getTextAlign:function() {
        return this.options['textAlign'];
    },

     /**
     * 设置text相对label水平对齐方式
     */
    setTextAlign: function(textAlign) {
        if(this.options['textAlign']!==textAlign) {
            this._setTextAlign(textAlign);
            this.options['textAlign'] = textAlign;
        }
        return this;
    },

    setSymbol:function(symbol, noEvent) {
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

    _refresh:function(noEvent) {
        var symbol = this.getSymbol();
        symbol['textName'] = this._content;
        if (this.options['box']) {
            if (!symbol['markerType']) {
                symbol['markerType'] = 'square';
            }
            if (this.options['boxAutoSize']) {
                 var size = Z.StringUtil.splitTextToRow(this._content, symbol)['size'];
                //背景和文字之间的间隔距离
                var padding = this.options['boxPadding'];
                var boxAlignPoint = Z.StringUtil.getAlignPoint(size, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment']);
                boxAlignPoint = boxAlignPoint.add(new Z.Point(Z.Util.getValueOrDefault(symbol['textDx'],0),Z.Util.getValueOrDefault(symbol['textDy'],0)));
                symbol['markerWidth'] = size['width']+padding['width'];

                symbol['markerHeight'] = size['height']+padding['height'];
                symbol['markerDx'] = boxAlignPoint.x+size['width']/2;
                symbol['markerDy'] = boxAlignPoint.y+size['height']/2;
            }
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
        this._symbol = symbol;
        this._onSymbolChanged();
    },

    _setTextAlign: function(align) {
        var symbol = this.getSymbol();
        if (!symbol['markerType']) {
            symbol['markerType'] = 'square';
        }
        var size = Z.StringUtil.splitTextToRow(this._content, symbol)['size'];
        if (this.options['box'] && !this.options['boxAutoSize']
           &&size['width']<this.options['boxMinWidth']) {
            var textDx = Z.Util.getValueOrDefault(symbol['textDx'],0);
            var textAlign = Z.Util.getValueOrDefault(this.options['textAlign'], 'center');
            var dx = (this.options['boxMinWidth'] - size['width'])/2;
            if(textAlign==='left') {
                textDx = textDx+dx;
                if(align==='right') {
                    dx = textDx+dx;
                } else {
                    dx = textDx;
                }
            } else if(textAlign==='right') {
                textDx = textDx-dx;
                if(align==='left') {
                    dx = textDx-dx;
                } else {
                    dx = textDx;
                }
            } else {
                if(align==='left') {
                    dx = textDx-dx;
                } else {
                    dx = textDx+dx;
                }
            }
            symbol['textDx']= dx;
            this._onSymbolChanged();
        }
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
