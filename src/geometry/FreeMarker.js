/**
 * label控件
 * @class maptalks.Label
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z.FreeMarker = Z.Marker.extend({

    /**
     * @cfg {Object} options label属性
     */
    options: {
        'pathWidth' : 0,
        'pathHeight' : 0
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
    initialize: function (path, coordinates, options) {
        this._path = path;
        this._coordinates = new Z.Coordinate(coordinates);
        this._initOptions(options);
    },

    /**
     * 获取label内容
     */
    getPath: function() {
        return this._path;
    },

    /**
     * 设置label内容
     */
    setPath: function(path) {
        this._path = path;
        this._refresh();
        this._fireEvent('pathchange');
        return this;
    },

    setSymbol:function(symbol) {
        if (!symbol || symbol === this.options['symbol']) {
           symbol = {};
        }
       var camelSymbol = this._prepareSymbol(symbol);
       var s = {};
       Z.Util.extend(s,camelSymbol);
       this._freeSymbol = s;
       this._refresh();
       return this;
    },

    getSymbol:function() {
        return Z.Util.extend({},this._freeSymbol);
    },

    toJSON:function(options) {
        if (!options) {
            options = {};
        }
        var json = {
            "feature" : this.toGeoJSON(options),
            "subType" : "FreeMarker",
            "path" : this._path
        };
        var other = this._exportGraphicOptions(options);
        Z.Util.extend(json,other);
        return json;
    },


    _refresh:function() {
        var symbol = this._freeSymbol;
        var styles = Z.symbolizer.VectorMarkerSymbolizer.translateStrokeAndFill(symbol);
        var svgStyles = [];
        if (styles) {
            for (var p in styles['stroke']) {
                if (styles['stroke'].hasOwnProperty(p)) {
                    if (!Z.Util.isNil(styles['stroke'][p])) {
                        svgStyles.push(p+'="'+styles['stroke'][p]+'"');
                    }
                }
            }
            for (var p in styles['fill']) {
                if (styles['fill'].hasOwnProperty(p)) {
                    if (!Z.Util.isNil(styles['fill'][p])) {
                        svgStyles.push(p+'="'+styles['fill'][p]+'"');
                    }
                }
            }
        }
        svgStyles = (svgStyles.length>0?svgStyles.join(' '):'');
        var svg = '<svg version="1.1" ';
        if (this.options['pathWidth'] && this.options['pathHeight']) {
            svg += 'height="'+this.options['pathWidth']+'" width="'+this.options['pathHeight']+'"';
        }
        svg += ' xmlns="http://www.w3.org/2000/svg"><defs></defs>';
        var pathes = Z.Util.isArray(this._path)?this._path:[this._path];
        for (var i = 0; i < pathes.length; i++) {
            svg += '<path d="'
                +pathes[i]+'"'+' '+svgStyles+'></path>'
        }
        svg += '</svg>';
        var img = 'data:image/svg+xml;base64,'+Z.Util.btoa(svg);
        var actualSymbol = {
            'markerFile'  : img,
            'markerWidth' : symbol['markerWidth'],
            'markerHeight' : symbol['markerHeight'],
            "markerOpacity" : symbol['markerOpacity'],
            "markerDx" : symbol['markerDx'],
            "markerDy" : symbol['markerDy']
        }
        this._symbol = actualSymbol;
        this._onSymbolChanged();
    }
});

Z.FreeMarker._fromJSON=function(json) {
    var feature = json['feature'];
    var label = new Z.Label(json['path'], feature['geometry']['coordinates'], json['options']);
    label.setProperties(feature['properties']);
    return label;
}
