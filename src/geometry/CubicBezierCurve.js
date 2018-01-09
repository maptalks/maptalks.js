import Curve from './Curve';
import Canvas from '../core/Canvas';

/**
 * Cubic Bezier Curve
 * @category geometry
 * @extends Curve
 * @param {Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @param {Object} [options=null]   - construct options defined in [CubicBezierCurve]{@link CubicBezierCurve#options}
 * @example
 * var curve = new CubicBezierCurve(
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
class CubicBezierCurve extends Curve {

    static fromJSON(json) {
        const feature = json['feature'];
        const curve = new CubicBezierCurve(feature['geometry']['coordinates'], json['options']);
        curve.setProperties(feature['properties']);
        return curve;
    }

    _toJSON(options) {
        return {
            'feature': this.toGeoJSON(options),
            'subType': 'CubicBezierCurve'
        };
    }

    // paint method on canvas
    _paintOn(ctx, points, lineOpacity) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        this._bezierCurve(ctx, points);
        Canvas._stroke(ctx, lineOpacity);
        this._paintArrow(ctx, points, lineOpacity);
    }

    _getArrowPoints(arrows, segments, lineWidth, arrowStyle, tolerance) {
        return this._getCurveArrowPoints(arrows, segments, lineWidth, arrowStyle, tolerance, 3);
    }
}

CubicBezierCurve.registerJSONType('CubicBezierCurve');

export default CubicBezierCurve;
