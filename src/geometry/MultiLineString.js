/**
 * @classdesc
 * Represents a Geometry type of MultiLineString
 * @class
 * @category geometry
 * @extends maptalks.GeometryCollection
 * @mixes maptalks.Geometry.MultiPoly
 * @param {Number[][][]|maptalks.Coordinate[][]|maptalks.LineString[]} data - construct data, coordinates or a array of linestrings
 * @param {Object} [options=null]           - options defined in [Geometry]{@link maptalks.Geometry#options}
 */
Z.MultiLineString=Z.MultiPolyline = Z.GeometryCollection.extend(/** @lends maptalks.MultiLineString.prototype */{

    includes:[Z.Geometry.MultiPoly],

    GeometryType:Z.Polyline,

    type:Z.Geometry['TYPE_MULTILINESTRING'],

    initialize:function(data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});
