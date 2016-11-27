/**
 * @classdesc Quadratic Bezier Curve
 * @class
 * @category geometry
 * @extends {maptalks.Curve}
 * @param {maptalks.Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @example
 * var curve = new maptalks.QuadBezierCurve(
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
maptalks.QuadBezierCurve = maptalks.Curve.extend(/** @lends maptalks.QuadBezierCurve.prototype */{

    _toJSON: function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'QuadBezierCurve'
        };
    },

    // paint method on canvas
    _paintOn: function (ctx, points, lineOpacity) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        this._quadraticCurve(ctx, points, lineOpacity);
        maptalks.Canvas._stroke(ctx, lineOpacity);

        this._paintArrow(ctx, points, lineOpacity);
    },

    _getArrowPlacement: function () {
        var placement = this.options['arrowPlacement'];
        // bezier curves doesn't support point arrows.
        if (placement === 'point') {
            placement = 'vertex-last';
        }
        return placement;
    }
});

maptalks.QuadBezierCurve.fromJSON = function (json) {
    var feature = json['feature'];
    var curve = new maptalks.QuadBezierCurve(feature['geometry']['coordinates'], json['options']);
    curve.setProperties(feature['properties']);
    return curve;
};
