/**
 * @classdesc
 * Represents a Geometry type of MultiPoint.
 * @class
 * @category geometry
 * @extends maptalks.GeometryCollection
 * @mixes maptalks.Geometry.MultiPoly
 * @param {Number[][]|maptalks.Coordinate[]|maptalks.Marker[]} data - construct data, coordinates or a array of markers
 * @param {Object} [options=null] - options defined in [nmaptalks.MultiPoint]{@link maptalks.MultiPoint#options}
 * @example
 * var multiPoint = new maptalks.MultiPoint(
 *     [
 *         [121.5080881906138, 31.241128104458117],
 *         [121.50804527526954, 31.237238340103413],
 *         [121.5103728890997, 31.23888972560888]
 *     ]
 * ).addTo(layer);
 */
Z.MultiPoint = Z.GeometryCollection.extend(/** @lends maptalks.MultiPoint.prototype */{
    includes:[Z.Geometry.MultiPoly],

    GeometryType:Z.Marker,

    type:Z.Geometry['TYPE_MULTIPOINT'],

    initialize:function (data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});
