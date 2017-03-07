import LineString from './LineString';
import Canvas2d from 'core/Canvas';

/**
 * Curve style LineString, an abstract parent class for all the curves.
 * @category geometry
 * @abstract
 * @extends LineString
 * @param {Coordinate[]|Number[][]} coordinates - coordinates of the line string
 * @param {Object} [options=null] - construct options defined in [LineString]{@link LineString#options}
 */
class Curve extends LineString {

    _arc(ctx, points, lineOpacity) {
        var degree = this.options['arcDegree'] * Math.PI / 180;
        for (var i = 1, l = points.length; i < l; i++) {
            Canvas2d._arcBetween(ctx, points[i - 1], points[i], degree);
            Canvas2d._stroke(ctx, lineOpacity);
        }
    }

    _quadraticCurve(ctx, points) {
        if (points.length <= 2) {
            Canvas2d._path(ctx, points);
            return;
        }
        Canvas2d.quadraticCurve(ctx, points);
    }

    _bezierCurve(ctx, points) {
        if (points.length <= 3) {
            Canvas2d._path(ctx, points);
            return;
        }
        var i, l;
        for (i = 1, l = points.length; i + 2 < l; i += 3) {
            ctx.bezierCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, points[i + 2].x, points[i + 2].y);
        }
        if (i < l) {
            for (;i < l; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
        }
    }
}

export default Curve;
