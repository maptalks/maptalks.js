/**
 * 多点类
 * @class maptalks.MultiPoint
 * @extends maptalks.MultiPoly
 * @author Maptalks Team
 */
Z.MultiPoint = Z.MultiPoly.extend({
    GeometryType:Z.Marker,

    type:Z.Geometry['TYPE_MULTIPOINT'],

    options:{
        'symbol':{
            'markerType'    : 'pie',
            'markerHeight'  : 24,
            'markerWidth'   : 24,
            'markerFill'    : "#de3333",
            "markerLineColor" : "#ffffff",
            "markerLineWidth" : 1
        }
    },

    initialize:function(data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});
