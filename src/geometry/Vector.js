/**
 * @classdesc
 * Base class for all the geometry classes besides [maptalks.Marker]{@link maptalks.Marker}. <br/>
 * It is abstract and not intended to be instantiated.
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
            'lineColor' : '#000',
            'lineWidth' : 1,
            'lineOpacity' : 1,

            'polygonFill' : '#fff', //default color in cartoCSS
            'polygonOpacity' : 1,
            'opacity' : 1
        }
    },

    _hitTestTolerance: function () {
        var symbol = this._getInternalSymbol();
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
