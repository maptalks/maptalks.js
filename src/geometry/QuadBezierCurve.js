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
Z.QuadBezierCurve = Z.Curve.extend(/** @lends maptalks.QuadBezierCurve.prototype */{

    _toJSON: function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'QuadBezierCurve'
        };
    },

    // paint method on canvas
    _paintOn: function (ctx, points, lineOpacity, fillOpacity, dasharray) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        this._quadraticCurve(ctx, points, lineOpacity);
        Z.Canvas._stroke(ctx, lineOpacity);
        var placement = this.options['arrowPlacement'];
        // bezier curves doesn't support point arrows.
        if (placement === 'point') {
            placement = 'vertex-last';
        }
        this._paintArrow(ctx, points, lineOpacity, placement);
    },

    // reference:
    // http://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
    _quadraticCurve: function (ctx, points) {
        var i, len = points.length;
        if (len <= 2) {
            Z.Canvas._path(ctx, points);
            return;
        }
        var xc, yc;
        for (i = 1; i < len - 2; i++) {
            xc = (points[i].x + points[i + 1].x) / 2;
            yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
            // curve through the last two points
        ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }
});

Z.QuadBezierCurve.fromJSON = function (json) {
    var feature = json['feature'];
    var curve = new Z.QuadBezierCurve(feature['geometry']['coordinates'], json['options']);
    curve.setProperties(feature['properties']);
    return curve;
};
