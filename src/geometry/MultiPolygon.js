/**
 * @classdesc
 * Represents a Geometry type of MultiPolygon
 * @class
 * @category geometry
 * @category geometry
 * @extends maptalks.GeometryCollection
 * @mixes maptalks.Geometry.MultiPoly
 * @param {Number[][][][]|maptalks.Coordinate[][][]|maptalks.Polygon[]} data - construct data, coordinates or a array of polygons
 * @param {Object} [options=null]           - options defined in [Geometry]{@link maptalks.Geometry#options}
 */
Z.MultiPolygon = Z.GeometryCollection.extend(/** @lends maptalks.MultiPolygon.prototype */{
    includes:[Z.Geometry.MultiPoly],
    GeometryType:Z.Polygon,

    type:Z.Geometry['TYPE_MULTIPOLYGON'],

    initialize:function (data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});
