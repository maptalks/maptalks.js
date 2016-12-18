import Curve from './Curve';
import Canvas from 'utils/Canvas';

/**
 * @classdesc Circle Arc Curve
 * @class
 * @category geometry
 * @extends {Curve}
 * @param {Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @param {Object} [options=null]   - construct options defined in [ArcCurve]{@link ArcCurve#options}
 * @example
 * var curve = new ArcCurve(
 *     [
 *         [121.47083767181408,31.214448123476995],
 *         [121.4751292062378,31.215475523000404],
 *         [121.47869117980943,31.211916269810335]
 *     ],
 *     {
 *         arcDegree : 120,
 *         symbol : {
 *             'lineWidth' : 5
 *         }
 *     }
 * ).addTo(layer);
 */
const ArcCurve = Curve.extend(/** @lends ArcCurve.prototype */ {
    /**
     * @property {Object} options
     * @property {Number} [options.arcDegree=90]           - circle arc's degree.
     */
    options: {
        'arcDegree': 90
    },

    _toJSON: function (options) {
        return {
            'feature': this.toGeoJSON(options),
            'subType': 'ArcCurve'
        };
    },

    // paint method on canvas
    _paintOn: function (ctx, points, lineOpacity) {
        ctx.beginPath();
        this._arc(ctx, points, lineOpacity);
        Canvas._stroke(ctx, lineOpacity);
        this._paintArrow(ctx, points, lineOpacity);
    }
});

ArcCurve.fromJSON = function (json) {
    var feature = json['feature'];
    var arc = new ArcCurve(feature['geometry']['coordinates'], json['options']);
    arc.setProperties(feature['properties']);
    return arc;
};

export default ArcCurve;
