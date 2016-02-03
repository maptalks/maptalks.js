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
        var w = symbol['lineWidth'];
        return w ? w / 2 : 3;
    }
});
