/**
 * 多面图形类
 * @class maptalks.MultiPolygon
 * @extends maptalks.MultiPoly
 * @author Maptalks Team
 */
Z.MultiPolygon = Z.MultiPoly.extend({
    GeometryType:Z.Polygon,

    type:Z.Geometry['TYPE_MULTIPOLYGON'],

    initialize:function(data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});
