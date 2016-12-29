import MultiType from './MultiPoly';
import { GeometryCollection } from './GeometryCollection';
import { LineString } from './LineString';

/**
 * @classdesc
 * Represents a Geometry type of MultiLineString
 * @class
 * @category geometry
 * @extends GeometryCollection
 * @mixes Geometry.MultiPoly
 * @param {Number[][][]|Coordinate[][]|LineString[]} data - construct data, coordinates or a array of linestrings
 * @param {Object} [options=null]           - options defined in [MultiLineString]{@link MultiLineString#options}
 * @example
 * var multiLineString = new MultiLineString(
 *      [
 *          [
 *              [121.5289450479131, 31.2420083925986],
 *              [121.52860172515919, 31.238926401171824]
 *          ],
 *          [
 *              [121.53091915374796, 31.241898323208233],
 *              [121.53104789978069, 31.23859618183896]
 *          ],
 *          [
 *               [121.5324641061405, 31.241898323208233],
 *               [121.53242119079626, 31.239146546752256]
 *           ]
 *       ],
 *       {
 *           symbol:{
 *               'lineColor' : '#000000',
 *               'lineWidth' : 5,
 *               'lineOpacity' : 1
 *           },
 *          draggable:true
 *      }
 * ).addTo(layer);
 */
export const MultiLineString = GeometryCollection.extend(/** @lends MultiLineString.prototype */ {

    includes: [MultiType],

    GeometryType: LineString,

    type: 'MultiLineString',

    initialize: function (data, opts) {
        this._initOptions(opts);
        this._initData(data);
    }
});

export const MultiPolyline = MultiLineString;
