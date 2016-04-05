/**
 * @classdesc Base class for all the geometry classes besides [maptalks.Marker]{@link maptalks.Marker}. <br/>
 * @class
 * @category geometry
 * @abstract
 * @extends maptalks.Geometry
 */
Z.Vector = Z.Geometry.extend(/** @lends maptalks.Vector.prototype */{
    /**
     * @property {Object} options - Vector's options
     * @property {Object} options.symbol - Vector's default symbol
     */
    options:{
        'symbol':{
            'lineColor' : '#000000',
            'lineWidth' : 1,
            'lineOpacity' : 1,

            'polygonFill' : '#ffffff',
            'polygonOpacity' : 0,
            'opacity' : 1
        }
    },

    _hitTestTolerance: function() {
        var symbol = this.getSymbol();
        var w;
        if (Z.Util.isArray(symbol)) {
            w = 0;
            for (var i = 0; i < symbol.length; i++) {
                if (Z.Util.isNumber(symbol[i]['lineWidth'])) {
                    if (symbol[i]['lineWidth'] > w) {
                        w = symbol[i]['lineWidth'];
                    }
                }
            }
        } else {
            w = symbol['lineWidth'];
        }
        return w ? w / 2 : 1.5;
    }
});
