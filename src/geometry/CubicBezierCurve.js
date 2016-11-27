/**
 * @classdesc Cubic Bezier Curve
 * @class
 * @category geometry
 * @extends {maptalks.Curve}
 * @param {maptalks.Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @param {Object} [options=null]   - construct options defined in [maptalks.CubicBezierCurve]{@link maptalks.CubicBezierCurve#options}
 * @example
 * var curve = new maptalks.CubicBezierCurve(
 *     [
 *         [121.47083767181408,31.214448123476995],
 *         [121.4751292062378,31.215475523000404],
 *         [121.47869117980943,31.211916269810335]
 *     ],
 *     {
 *         symbol : {
 *             'lineWidth' : 5
 *         }
 *     }
 * ).addTo(layer);
 */
maptalks.CubicBezierCurve = maptalks.Curve.extend(/** @lends maptalks.CubicBezierCurve.prototype */{

    _toJSON: function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'CubicBezierCurve'
        };
    },

    // paint method on canvas
    _paintOn: function (ctx, points, lineOpacity) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        this._bezierCurve(ctx, points, lineOpacity);
        maptalks.Canvas._stroke(ctx, lineOpacity);
        this._paintArrow(ctx, points, lineOpacity);
    }
});

maptalks.CubicBezierCurve.fromJSON = function (json) {
    var feature = json['feature'];
    var curve = new maptalks.CubicBezierCurve(feature['geometry']['coordinates'], json['options']);
    curve.setProperties(feature['properties']);
    return curve;
};
