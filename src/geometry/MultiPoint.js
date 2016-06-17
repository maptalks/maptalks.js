/**
 * @classdesc
 * Represents a Geometry type of MultiPoint.
 * @class
 * @category geometry
 * @extends maptalks.GeometryCollection
 * @mixes maptalks.Geometry.MultiPoly
 * @param {Number[][]|maptalks.Coordinate[]|maptalks.Marker[]} data - construct data, coordinates or a array of markers
 * @param {Object} [options=null]           - specific construct options for MultiPoint, also support options defined in [Geometry]{@link maptalks.Geometry#options}
 * @param {Object} [options.symbol=object]  - default symbol of the MultiPoint.
 */
Z.MultiPoint = Z.GeometryCollection.extend(/** @lends maptalks.MultiPoint.prototype */{
    includes:[Z.Geometry.MultiPoly],

    GeometryType:Z.Marker,

    /**
     * @property {String} type - MultiPoint
     * @static
     */
    type:Z.Geometry['TYPE_MULTIPOINT'],

    initialize:function (data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});
