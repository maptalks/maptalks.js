/**
 * 多线图形类
 * @class maptalks.MultiPolyline
 * @extends maptalks.MultiPoly
 * @author Maptalks Team
 */
Z.MultiLineString=Z.MultiPolyline = Z.MultiPoly.extend({
    GeometryType:Z.Polyline,

    type:Z.Geometry['TYPE_MULTILINESTRING'],

    initialize:function(data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});
