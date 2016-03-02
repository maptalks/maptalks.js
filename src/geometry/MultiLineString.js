/**
 * @classdesc
 * Represents a Geometry type of MultiLineString
 * @class
 * @category geometry
 * @extends maptalks.MultiPoly
 * @param {Number[][][]|maptalks.Coordinate[][]|maptalks.LineString[]} data - construct data, coordinates or a array of linestrings
 * @param {Object} [options=null]           - options defined in [Geometry]{@link maptalks.Geometry#options}
 */
Z.MultiLineString=Z.MultiPolyline = Z.MultiPoly.extend(/** @lends maptalks.MultiLineString.prototype */{
    GeometryType:Z.Polyline,

    type:Z.Geometry['TYPE_MULTILINESTRING'],

    initialize:function(data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});
