Z.Vector = Z.Geometry.extend({
    options:{
        'symbol':{
            'lineColor' : '#474cf8',
            'lineWidth' : 3,
            'lineOpacity' : 1,

            'polygonFill' : '#ffffff',
            'polygonOpacity' : 0
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
